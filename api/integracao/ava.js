// Integração AVA: conector configurável (sem scraping) — o dono define URL,
// cabeçalhos, paginação e o de-para dos campos de produto.
import { ensureSchema, getMeta, setMeta } from "../../lib/db.js";
import { getActor } from "../../lib/auth.js";
import { json, failure, readBody } from "../../lib/http.js";
import { normalizeAvaConfig, avaFetchRecords, collectFields, mapAvaRecord } from "../../shared/ava.mjs";
import { findCatalogItem, upsertCatalogItem } from "../../lib/repo.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const actor = await getActor(req);
    if (!actor || actor.role !== "owner")
      return json(res, 403, { error: "Apenas o dono pode configurar integrações." });

    const current = (await getMeta("ava")) || {};

    if (req.method === "GET") {
      const safeHeaders = (current.headers || []).map((h) => ({ name: h.name, filled: Boolean(h.value) }));
      return json(res, 200, {
        config: { ...current, headers: safeHeaders },
        lastSync: (await getMeta("avaLastSync")) || null,
      });
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const config = normalizeAvaConfig(body.config, current);

      if (body.action === "save") {
        await setMeta("ava", config);
        return json(res, 200, { ok: true });
      }

      if (body.action === "test") {
        try {
          const sample = await avaFetchRecords(config, { sample: true });
          return json(res, 200, {
            count: sample.length,
            fields: sample.length ? collectFields(sample[0]) : [],
            sample: sample.slice(0, 2),
          });
        } catch (e) {
          return json(res, 400, { error: e instanceof Error ? e.message : "Falha ao testar a conexão." });
        }
      }

      if (body.action === "sync") {
        if (!config.map.name)
          return json(res, 400, { error: "Defina ao menos o campo do nome do produto." });
        try {
          const records = await avaFetchRecords(config, { sample: false });
          const now = new Date().toISOString();
          let created = 0, updated = 0, skipped = 0;
          for (const record of records) {
            const item = mapAvaRecord(record, config.map, actor.email, now, config.url);
            if (!item) { skipped++; continue; }
            const existing = await findCatalogItem(item.id);
            await upsertCatalogItem(item);
            if (existing) updated++; else created++;
          }
          const lastSync = { at: now, fetched: records.length, created, updated, skipped };
          await setMeta("ava", config);
          await setMeta("avaLastSync", lastSync);
          return json(res, 200, { fetched: records.length, created, updated, skipped });
        } catch (e) {
          return json(res, 400, { error: e instanceof Error ? e.message : "Falha ao sincronizar." });
        }
      }

      return json(res, 400, { error: "Ação inválida." });
    }

    return json(res, 405, { error: "Método não suportado." });
  } catch (error) {
    return failure(res, error);
  }
}
