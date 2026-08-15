import { asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { budgetItems, budgets, catalogItems, catalogMeta } from "../../../db/schema";
import { initialCatalog } from "../../../db/catalog-seed";
import { adminActorFrom } from "../../admin-access";

type CatalogKind = "equipment" | "service";
type BudgetStatus = "draft" | "sent" | "approved";

type ItemPayload = {
  id?: string;
  kind?: CatalogKind;
  name?: string;
  category?: string;
  brand?: string;
  model?: string;
  sku?: string;
  system?: string;
  description?: string;
  sourceUrl?: string;
  unit?: string;
  purchasePrice?: number;
  salePrice?: number;
};

type BudgetPatch = {
  client?: string;
  project?: string;
  status?: BudgetStatus;
  validityDays?: number;
  discountPercent?: number;
  adjustment?: number;
  notes?: string;
};

type LinePatch = {
  environment?: string;
  quantity?: number;
  purchasePrice?: number;
  salePrice?: number;
  discountPercent?: number;
};

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function moneyCents(value: unknown, allowNegative = false) {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.round((allowNegative ? amount : Math.max(0, amount)) * 100);
}

function bounded(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  const detail = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  if (`${message} ${detail}`.includes("no such table")) return "A base do orçamento ainda não foi preparada.";
  return "Não foi possível acessar a base compartilhada do orçamento.";
}

const catalogSeedVersion = "2026-08-11-catalogo-integral-editor-v4";

let schemaReady = false;
async function ensureSchema(db: Awaited<ReturnType<typeof getDb>>) {
  if (schemaReady) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS catalog_items (
    id text PRIMARY KEY, kind text NOT NULL, name text NOT NULL,
    category text NOT NULL DEFAULT '', brand text NOT NULL DEFAULT '',
    model text NOT NULL DEFAULT '', sku text NOT NULL DEFAULT '',
    system text NOT NULL DEFAULT 'UNIVERSAL', description text NOT NULL DEFAULT '',
    source_url text NOT NULL DEFAULT '', unit text NOT NULL DEFAULT 'un',
    purchase_price_cents integer NOT NULL DEFAULT 0, sale_price_cents integer NOT NULL DEFAULT 0,
    updated_by text NOT NULL DEFAULT 'Equipe Sona',
    created_at text NOT NULL DEFAULT to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    updated_at text NOT NULL DEFAULT to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS catalog_meta (
    key text PRIMARY KEY, value text NOT NULL,
    updated_at text NOT NULL DEFAULT to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS budgets (
    id text PRIMARY KEY, code text NOT NULL UNIQUE,
    client text NOT NULL DEFAULT 'Novo cliente', project text NOT NULL DEFAULT 'Novo projeto',
    status text NOT NULL DEFAULT 'draft', validity_days integer NOT NULL DEFAULT 10,
    discount_percent double precision NOT NULL DEFAULT 0, adjustment_cents integer NOT NULL DEFAULT 0,
    notes text NOT NULL DEFAULT '', created_by text NOT NULL DEFAULT 'Equipe Sona',
    updated_by text NOT NULL DEFAULT 'Equipe Sona',
    created_at text NOT NULL DEFAULT to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    updated_at text NOT NULL DEFAULT to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS budget_items (
    id text PRIMARY KEY, budget_id text NOT NULL, catalog_item_id text,
    kind text NOT NULL, name text NOT NULL, category text NOT NULL DEFAULT '',
    brand text NOT NULL DEFAULT '', model text NOT NULL DEFAULT '', sku text NOT NULL DEFAULT '',
    unit text NOT NULL DEFAULT 'un', environment text NOT NULL DEFAULT 'Geral',
    quantity double precision NOT NULL DEFAULT 1, purchase_price_cents integer NOT NULL DEFAULT 0,
    sale_price_cents integer NOT NULL DEFAULT 0, discount_percent double precision NOT NULL DEFAULT 0,
    sort_order integer NOT NULL DEFAULT 0,
    created_at text NOT NULL DEFAULT to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    updated_at text NOT NULL DEFAULT to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
    FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE SET NULL
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS budget_items_budget_idx ON budget_items (budget_id, sort_order)`);
  schemaReady = true;
}

async function seedCatalog() {
  const db = await getDb();
  const [seedState] = await db.select().from(catalogMeta).where(eq(catalogMeta.key, "catalog_seed_version"));
  if (seedState?.value === catalogSeedVersion) return;
  for (let index = 0; index < initialCatalog.length; index += 5) {
    await db.insert(catalogItems).values(initialCatalog.slice(index, index + 5)).onConflictDoNothing();
  }
  await db.update(catalogItems)
    .set({ system: "SMARTLIFE", updatedAt: new Date().toISOString() })
    .where(inArray(catalogItems.system, ["HUBITAT", "SEGURANÇA"]));
  await db.update(catalogItems)
    .set({ system: "VETRA", updatedAt: new Date().toISOString() })
    .where(inArray(catalogItems.system, ["VERTES", "ÁUDIO/VÍDEO", "WI-FI", "UNIVERSAL"]));
  await db.update(catalogItems)
    .set({
      name: "Central de automação SmartLife",
      brand: "Tuya / Smart Life",
      model: "Gateway Zigbee 3.0",
      sku: "SL-GW-ZB-PRO",
      system: "SMARTLIFE",
      description: "Central para integração de dispositivos, cenas e rotinas do ecossistema SmartLife.",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(catalogItems.id, "sona-hubitat-c8pro"));
  await db.update(catalogItems)
    .set({
      name: "Programação SmartLife e integrações",
      model: "SmartLife",
      sku: "SV-SL-PROG",
      system: "SMARTLIFE",
      description: "Configuração de dispositivos, integrações, cenas, rotinas e comandos do ecossistema SmartLife.",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(catalogItems.id, "sv-hubitat-program"));
  await db.insert(catalogMeta)
    .values({ key: "catalog_seed_version", value: catalogSeedVersion, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({ target: catalogMeta.key, set: { value: catalogSeedVersion, updatedAt: new Date().toISOString() } });
}

async function createBudgetRecord(actor: string, client = "Novo cliente", project = "Novo projeto") {
  const db = await getDb();
  const existingCodes = await db.select({ code: budgets.code }).from(budgets);
  const now = new Date();
  const sequence = String(existingCodes.reduce((highest, row) => {
    const value = Number(row.code.split("-").at(-1));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0) + 1).padStart(3, "0");
  const code = `ORC-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}-${sequence}`;
  const [created] = await db.insert(budgets).values({
    id: crypto.randomUUID(), code, client, project, createdBy: actor, updatedBy: actor,
  }).returning();
  return created;
}

function mapCatalogItem(item: typeof catalogItems.$inferSelect) {
  return {
    id: item.id, kind: item.kind, name: item.name, category: item.category,
    brand: item.brand, model: item.model, sku: item.sku, system: item.system,
    description: item.description, sourceUrl: item.sourceUrl, unit: item.unit,
    purchasePrice: item.purchasePriceCents / 100, salePrice: item.salePriceCents / 100,
    updatedBy: item.updatedBy, updatedAt: item.updatedAt,
  };
}

function mapBudgetLine(line: typeof budgetItems.$inferSelect) {
  return {
    id: line.id, budgetId: line.budgetId, catalogItemId: line.catalogItemId,
    kind: line.kind, name: line.name, category: line.category, brand: line.brand,
    model: line.model, sku: line.sku, unit: line.unit, environment: line.environment,
    quantity: line.quantity, purchasePrice: line.purchasePriceCents / 100,
    salePrice: line.salePriceCents / 100, discountPercent: line.discountPercent,
    sortOrder: line.sortOrder, updatedAt: line.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const actor = await adminActorFrom(request);
    if (!actor) return Response.json({ error: "Acesso administrativo necessário." }, { status: 401 });
    const db = await getDb();
    await ensureSchema(db);
    await seedCatalog();
    let budgetRows = await db.select().from(budgets).orderBy(desc(budgets.updatedAt));
    if (!budgetRows.length) {
      await createBudgetRecord(actor);
      budgetRows = await db.select().from(budgets).orderBy(desc(budgets.updatedAt));
    }
    const [catalogRows, lineRows] = await Promise.all([
      db.select().from(catalogItems).orderBy(asc(catalogItems.category), asc(catalogItems.name)),
      db.select().from(budgetItems).orderBy(asc(budgetItems.sortOrder), asc(budgetItems.createdAt)),
    ]);
    const linesByBudget = new Map<string, ReturnType<typeof mapBudgetLine>[]>();
    for (const line of lineRows) {
      const list = linesByBudget.get(line.budgetId) ?? [];
      list.push(mapBudgetLine(line));
      linesByBudget.set(line.budgetId, list);
    }
    return Response.json({
      catalogItems: catalogRows.map(mapCatalogItem),
      budgets: budgetRows.map((budget) => ({
        id: budget.id, code: budget.code, client: budget.client, project: budget.project,
        status: budget.status, validityDays: budget.validityDays,
        discountPercent: budget.discountPercent, adjustment: budget.adjustmentCents / 100,
        notes: budget.notes, createdBy: budget.createdBy, updatedBy: budget.updatedBy,
        createdAt: budget.createdAt, updatedAt: budget.updatedAt,
        items: linesByBudget.get(budget.id) ?? [],
      })),
    });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await adminActorFrom(request);
  if (!actor) return Response.json({ error: "Acesso administrativo necessário." }, { status: 401 });

  try {
    const payload = (await request.json()) as {
      action?: "upsertCatalogItem" | "deleteCatalogItem" | "createBudget" | "updateBudget" |
        "addBudgetItem" | "updateBudgetItem" | "deleteBudgetItem" | "clearBudget" | "deleteBudget";
      item?: ItemPayload;
      budget?: BudgetPatch;
      line?: LinePatch;
      itemId?: string;
      budgetId?: string;
      lineId?: string;
    };
    const db = await getDb();
    await ensureSchema(db);

    if (payload.action === "upsertCatalogItem") {
      const item = payload.item ?? {};
      const kind: CatalogKind = item.kind === "service" ? "service" : "equipment";
      const name = clean(item.name, 120);
      if (!name) return Response.json({ error: "Informe o nome do item." }, { status: 400 });
      const id = clean(item.id, 80) || crypto.randomUUID();
      const values = {
        id, kind, name, category: clean(item.category, 80), brand: clean(item.brand, 80),
        model: clean(item.model, 100), sku: clean(item.sku, 60),
        system: clean(item.system, 30).toUpperCase() || "UNIVERSAL",
        description: clean(item.description, 800), sourceUrl: clean(item.sourceUrl, 500),
        unit: clean(item.unit, 12) || (kind === "service" ? "sv" : "un"),
        purchasePriceCents: moneyCents(item.purchasePrice), salePriceCents: moneyCents(item.salePrice),
        updatedBy: actor, updatedAt: new Date().toISOString(),
      };
      const [saved] = await db.insert(catalogItems).values(values)
        .onConflictDoUpdate({ target: catalogItems.id, set: values }).returning();
      return Response.json({ item: mapCatalogItem(saved) });
    }

    if (payload.action === "deleteCatalogItem") {
      const itemId = clean(payload.itemId, 80);
      if (!itemId) return Response.json({ error: "Item inválido." }, { status: 400 });
      await db.delete(catalogItems).where(eq(catalogItems.id, itemId));
      return Response.json({ ok: true });
    }

    if (payload.action === "createBudget") {
      const created = await createBudgetRecord(actor, clean(payload.budget?.client, 120) || "Novo cliente", clean(payload.budget?.project, 120) || "Novo projeto");
      return Response.json({ budgetId: created.id, code: created.code });
    }

    const budgetId = clean(payload.budgetId, 80);
    if (!budgetId) return Response.json({ error: "Orçamento inválido." }, { status: 400 });

    if (payload.action === "updateBudget") {
      const patch = payload.budget ?? {};
      const values: Partial<typeof budgets.$inferInsert> = { updatedBy: actor, updatedAt: new Date().toISOString() };
      if (patch.client !== undefined) values.client = clean(patch.client, 120) || "Novo cliente";
      if (patch.project !== undefined) values.project = clean(patch.project, 120) || "Novo projeto";
      if (patch.status !== undefined) values.status = ["draft", "sent", "approved"].includes(patch.status) ? patch.status : "draft";
      if (patch.validityDays !== undefined) values.validityDays = Math.round(bounded(patch.validityDays, 1, 365, 10));
      if (patch.discountPercent !== undefined) values.discountPercent = bounded(patch.discountPercent, 0, 100, 0);
      if (patch.adjustment !== undefined) values.adjustmentCents = moneyCents(patch.adjustment, true);
      if (patch.notes !== undefined) values.notes = clean(patch.notes, 1200);
      await db.update(budgets).set(values).where(eq(budgets.id, budgetId));
      return Response.json({ ok: true, updatedBy: actor });
    }

    if (payload.action === "addBudgetItem") {
      const catalogItemId = clean(payload.itemId, 80);
      const [catalogItem] = await db.select().from(catalogItems).where(eq(catalogItems.id, catalogItemId));
      if (!catalogItem) return Response.json({ error: "Item do catálogo não encontrado." }, { status: 404 });
      const [orderRow] = await db.select({ value: count() }).from(budgetItems).where(eq(budgetItems.budgetId, budgetId));
      const [line] = await db.insert(budgetItems).values({
        id: crypto.randomUUID(), budgetId, catalogItemId: catalogItem.id,
        kind: catalogItem.kind, name: catalogItem.name, category: catalogItem.category,
        brand: catalogItem.brand, model: catalogItem.model, sku: catalogItem.sku,
        unit: catalogItem.unit, environment: clean(payload.line?.environment, 80) || "Geral",
        quantity: bounded(payload.line?.quantity, 0.01, 99999, 1),
        purchasePriceCents: catalogItem.purchasePriceCents, salePriceCents: catalogItem.salePriceCents,
        discountPercent: 0, sortOrder: orderRow?.value ?? 0,
      }).returning();
      await db.update(budgets).set({ updatedBy: actor, updatedAt: new Date().toISOString() }).where(eq(budgets.id, budgetId));
      return Response.json({ line: mapBudgetLine(line) });
    }

    if (payload.action === "updateBudgetItem") {
      const lineId = clean(payload.lineId, 80);
      if (!lineId) return Response.json({ error: "Linha inválida." }, { status: 400 });
      const patch = payload.line ?? {};
      const values: Partial<typeof budgetItems.$inferInsert> = { updatedAt: new Date().toISOString() };
      if (patch.environment !== undefined) values.environment = clean(patch.environment, 80) || "Geral";
      if (patch.quantity !== undefined) values.quantity = bounded(patch.quantity, 0.01, 99999, 1);
      if (patch.purchasePrice !== undefined) values.purchasePriceCents = moneyCents(patch.purchasePrice);
      if (patch.salePrice !== undefined) values.salePriceCents = moneyCents(patch.salePrice);
      if (patch.discountPercent !== undefined) values.discountPercent = bounded(patch.discountPercent, 0, 100, 0);
      await db.update(budgetItems).set(values).where(eq(budgetItems.id, lineId));
      await db.update(budgets).set({ updatedBy: actor, updatedAt: new Date().toISOString() }).where(eq(budgets.id, budgetId));
      return Response.json({ ok: true, updatedBy: actor });
    }

    if (payload.action === "deleteBudgetItem") {
      const lineId = clean(payload.lineId, 80);
      if (!lineId) return Response.json({ error: "Linha inválida." }, { status: 400 });
      await db.delete(budgetItems).where(eq(budgetItems.id, lineId));
      await db.update(budgets).set({ updatedBy: actor, updatedAt: new Date().toISOString() }).where(eq(budgets.id, budgetId));
      return Response.json({ ok: true });
    }

    if (payload.action === "clearBudget") {
      await db.delete(budgetItems).where(eq(budgetItems.budgetId, budgetId));
      await db.update(budgets).set({ updatedBy: actor, updatedAt: new Date().toISOString() }).where(eq(budgets.id, budgetId));
      return Response.json({ ok: true });
    }

    if (payload.action === "deleteBudget") {
      await db.delete(budgets).where(eq(budgets.id, budgetId));
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}
