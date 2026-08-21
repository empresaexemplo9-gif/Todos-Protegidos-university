// Propostas: lista/salva pela equipe autenticada e leitura pública por token
// (link enviado ao cliente, com o aceite).
import { randomUUID } from "node:crypto";
import { ensureSchema } from "../lib/db.js";
import { getActor } from "../lib/auth.js";
import { json, failure, readBody, clean, sanitizeHtml } from "../lib/http.js";
import {
  seedCatalog,
  listProposals, findProposalById, findProposalByCode, findProposalByToken, saveProposalDraft,
  setProposalStatus, acceptProposal, deleteProposal, mapProposal,
} from "../lib/repo.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();
    await seedCatalog();

    if (req.method === "GET") {
      const token = clean(req.query?.token, 160);
      if (token) {
        const row = await findProposalByToken(token);
        if (!row || row.status === "draft") return json(res, 404, { error: "Proposta não encontrada." });
        return json(res, 200, { proposal: mapProposal(row, true, false) });
      }
      const actor = await getActor(req);
      if (!actor) return json(res, 401, { error: "Acesso restrito." });
      return json(res, 200, { proposals: await listProposals() });
    }

    if (req.method === "POST") {
      const body = await readBody(req);

      if (body.action === "accept") {
        const token = clean(body.token, 160);
        const name = clean(body.acceptance?.name, 140);
        const email = clean(body.acceptance?.email, 180);
        const doc = clean(body.acceptance?.document, 40);
        if (!token || !name || !email || !doc || body.acceptance?.confirmed !== true)
          return json(res, 400, { error: "Preencha os dados e confirme o aceite." });
        let row = await findProposalByToken(token);
        if (!row || row.status === "draft") return json(res, 404, { error: "Proposta não encontrada." });
        if (row.status !== "accepted")
          row = await acceptProposal(row.id, { name, email, document: doc }, new Date().toISOString());
        return json(res, 200, { proposal: mapProposal(row, true, false) });
      }

      const actor = await getActor(req);
      if (!actor) return json(res, 401, { error: "Acesso restrito." });
      const id = clean(body.id, 100);

      if (body.action === "saveDraft") {
        const code = clean(body.code, 80);
        if (!code || body.data === undefined)
          return json(res, 400, { error: "Dados da proposta incompletos." });
        if (JSON.stringify(body.data).length > 1_750_000)
          return json(res, 413, {
            error: "A proposta excedeu o limite de imagens. Remova algumas imagens ou use arquivos menores.",
          });
        const existing = id ? await findProposalById(id) : await findProposalByCode(code);
        const row = await saveProposalDraft(
          existing,
          {
            code,
            client: clean(body.client, 160) || "Novo cliente",
            project: clean(body.project, 160) || "Novo projeto",
            data: body.data,
            manualHtml: sanitizeHtml(body.manualHtml),
            updatedAt: new Date().toISOString(),
          },
          actor.email,
        );
        return json(res, 200, { proposal: mapProposal(row) });
      }

      if (!id) return json(res, 400, { error: "Proposta inválida." });
      const row = await findProposalById(id);
      if (!row) return json(res, 404, { error: "Proposta não encontrada." });
      const now = new Date().toISOString();

      if (body.action === "finalize") {
        const token = row.public_token || (randomUUID() + randomUUID()).replace(/-/g, "");
        const updated = await setProposalStatus(row.id, "finalized", actor.email, now, token);
        return json(res, 200, { proposal: mapProposal(updated) });
      }
      if (body.action === "markSent") {
        const updated = await setProposalStatus(row.id, "sent", actor.email, now);
        return json(res, 200, { proposal: mapProposal(updated) });
      }
      if (body.action === "delete") {
        await deleteProposal(row.id);
        return json(res, 200, { ok: true });
      }
      return json(res, 400, { error: "Ação inválida." });
    }

    return json(res, 405, { error: "Método não suportado." });
  } catch (error) {
    return failure(res, error);
  }
}
