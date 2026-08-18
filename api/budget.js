// Orçamento e catálogo de itens.
import { randomUUID } from "node:crypto";
import { ensureSchema } from "../lib/db.js";
import { getActor } from "../lib/auth.js";
import { json, failure, readBody, clean, money, bounded } from "../lib/http.js";
import {
  seedCatalog, listCatalogItems, findCatalogItem, findCatalogItemBySku, upsertCatalogItem,
  deleteCatalogItem, listBudgetsWithItems, countBudgets, findBudget, createBudget, updateBudget,
  touchBudget, deleteBudget, countBudgetItems, insertBudgetItem, updateBudgetItem,
  deleteBudgetItem, clearBudgetItems, mapCatalogItem, mapLine,
} from "../lib/repo.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const actor = await getActor(req);
    if (!actor) return json(res, 401, { error: "Acesso restrito." });
    const now = new Date().toISOString();

    if (req.method === "GET") {
      await seedCatalog();
      if ((await countBudgets()) === 0) await createBudget(actor.email);
      return json(res, 200, {
        catalogItems: await listCatalogItems(),
        budgets: await listBudgetsWithItems(),
      });
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const action = body.action;

      if (action === "upsertCatalogItem") {
        const item = body.item || {};
        const name = clean(item.name, 120);
        if (!name) return json(res, 400, { error: "Informe o nome do item." });
        const kind = item.kind === "service" ? "service" : "equipment";
        const saved = await upsertCatalogItem({
          id: clean(item.id, 80) || randomUUID(), kind, name,
          category: clean(item.category, 80), brand: clean(item.brand, 80),
          model: clean(item.model, 100), sku: clean(item.sku, 60),
          system: clean(item.system, 30).toUpperCase() || "UNIVERSAL",
          description: clean(item.description, 800), sourceUrl: clean(item.sourceUrl, 500),
          unit: clean(item.unit, 12) || (kind === "service" ? "sv" : "un"),
          purchasePrice: money(item.purchasePrice), salePrice: money(item.salePrice),
          updatedBy: actor.email, updatedAt: now,
        });
        return json(res, 200, { item: mapCatalogItem(saved) });
      }

      if (action === "deleteCatalogItem") {
        const itemId = clean(body.itemId, 80);
        if (!itemId) return json(res, 400, { error: "Item inválido." });
        await deleteCatalogItem(itemId);
        return json(res, 200, { ok: true });
      }

      if (action === "createBudget") {
        const b = await createBudget(
          actor.email,
          clean(body.budget?.client, 120) || "Novo cliente",
          clean(body.budget?.project, 120) || "Novo projeto",
        );
        return json(res, 200, { budgetId: b.id, code: b.code });
      }

      if (action === "importCatalog") {
        const rows = Array.isArray(body.items) ? body.items : [];
        if (!rows.length) return json(res, 400, { error: "Nenhum item para importar." });
        let created = 0, updated = 0, skipped = 0;
        for (const raw of rows.slice(0, 5000)) {
          const name = clean(raw?.name, 120);
          if (!name) { skipped++; continue; }
          const kind = raw?.kind === "service" ? "service" : "equipment";
          const sku = clean(raw?.sku, 60);
          const id = sku
            ? `imp-${sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`
            : randomUUID();
          const existing = (await findCatalogItem(id)) || (sku ? await findCatalogItemBySku(sku) : null);
          await upsertCatalogItem({
            id: existing ? existing.id : id, kind, name,
            category: clean(raw?.category, 80), brand: clean(raw?.brand, 80),
            model: clean(raw?.model, 100), sku,
            system: clean(raw?.system, 30).toUpperCase() || "SMARTLIFE",
            description: clean(raw?.description, 800), sourceUrl: "",
            unit: clean(raw?.unit, 12) || (kind === "service" ? "sv" : "un"),
            purchasePrice: money(raw?.purchasePrice), salePrice: money(raw?.salePrice),
            updatedBy: actor.email, updatedAt: now,
          });
          if (existing) updated++; else created++;
        }
        return json(res, 200, { created, updated, skipped });
      }

      const budgetId = clean(body.budgetId, 80);
      if (!budgetId) return json(res, 400, { error: "Orçamento inválido." });

      if (action === "updateBudget") {
        const patch = body.budget || {};
        const values = {};
        if (patch.client !== undefined) values.client = clean(patch.client, 120) || "Novo cliente";
        if (patch.project !== undefined) values.project = clean(patch.project, 120) || "Novo projeto";
        if (patch.status !== undefined)
          values.status = ["draft", "sent", "approved"].includes(patch.status) ? patch.status : "draft";
        if (patch.validityDays !== undefined)
          values.validityDays = Math.round(bounded(patch.validityDays, 1, 365, 10));
        if (patch.discountPercent !== undefined)
          values.discountPercent = bounded(patch.discountPercent, 0, 100, 0);
        if (patch.adjustment !== undefined) values.adjustment = money(patch.adjustment, true);
        if (patch.notes !== undefined) values.notes = clean(patch.notes, 1200);
        const ok = await updateBudget(budgetId, values, actor.email, now);
        if (!ok) return json(res, 404, { error: "Orçamento não encontrado." });
        return json(res, 200, { ok: true, updatedBy: actor.email });
      }

      if (action === "addBudgetItem") {
        if (!(await findBudget(budgetId))) return json(res, 404, { error: "Orçamento não encontrado." });
        const catItem = await findCatalogItem(clean(body.itemId, 80));
        if (!catItem) return json(res, 404, { error: "Item do catálogo não encontrado." });
        const line = await insertBudgetItem({
          id: randomUUID(), budgetId, catalogItemId: catItem.id, kind: catItem.kind,
          name: catItem.name, category: catItem.category, brand: catItem.brand, model: catItem.model,
          sku: catItem.sku, unit: catItem.unit,
          environment: clean(body.line?.environment, 80) || "Geral",
          quantity: bounded(body.line?.quantity, 0.01, 99999, 1),
          purchasePrice: catItem.purchase_price, salePrice: catItem.sale_price,
          discountPercent: 0, sortOrder: await countBudgetItems(budgetId),
          createdAt: now, updatedAt: now,
        });
        await touchBudget(budgetId, actor.email, now);
        return json(res, 200, {
          line: mapLine({
            id: line.id, budget_id: budgetId, catalog_item_id: line.catalogItemId, kind: line.kind,
            name: line.name, category: line.category, brand: line.brand, model: line.model,
            sku: line.sku, unit: line.unit, environment: line.environment, quantity: line.quantity,
            purchase_price: line.purchasePrice, sale_price: line.salePrice,
            discount_percent: line.discountPercent, sort_order: line.sortOrder, updated_at: now,
          }),
        });
      }

      if (action === "updateBudgetItem") {
        const patch = body.line || {};
        const values = {};
        if (patch.environment !== undefined)
          values.environment = clean(patch.environment, 80) || "Geral";
        if (patch.quantity !== undefined) values.quantity = bounded(patch.quantity, 0.01, 99999, 1);
        if (patch.purchasePrice !== undefined) values.purchasePrice = money(patch.purchasePrice);
        if (patch.salePrice !== undefined) values.salePrice = money(patch.salePrice);
        if (patch.discountPercent !== undefined)
          values.discountPercent = bounded(patch.discountPercent, 0, 100, 0);
        const line = await updateBudgetItem(clean(body.lineId, 80), values, now);
        if (!line) return json(res, 400, { error: "Linha inválida." });
        await touchBudget(budgetId, actor.email, now);
        return json(res, 200, { ok: true, updatedBy: actor.email });
      }

      if (action === "deleteBudgetItem") {
        await deleteBudgetItem(clean(body.lineId, 80));
        await touchBudget(budgetId, actor.email, now);
        return json(res, 200, { ok: true });
      }

      if (action === "clearBudget") {
        await clearBudgetItems(budgetId);
        await touchBudget(budgetId, actor.email, now);
        return json(res, 200, { ok: true });
      }

      if (action === "deleteBudget") {
        await deleteBudget(budgetId);
        return json(res, 200, { ok: true });
      }

      return json(res, 400, { error: "Ação inválida." });
    }

    return json(res, 405, { error: "Método não suportado." });
  } catch (error) {
    return failure(res, error);
  }
}
