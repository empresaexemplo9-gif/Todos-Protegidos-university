// Acesso aos dados no Postgres. Cada função devolve os objetos já no formato
// que as telas esperam (o mesmo contrato do servidor local).
import { randomUUID } from "node:crypto";
import { sql, getMeta, setMeta } from "./db.js";
import { hashPassword } from "./auth.js";
import { initialCatalog } from "../server/catalog-seed.mjs";

const nowIso = () => new Date().toISOString();

/* ------------------------------ mapeadores ------------------------------ */
export const mapUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, createdAt: u.created_at,
});
export const mapCatalogItem = (i) => ({
  id: i.id, kind: i.kind, name: i.name, category: i.category, brand: i.brand, model: i.model,
  sku: i.sku, system: i.system, description: i.description, sourceUrl: i.source_url, unit: i.unit,
  purchasePrice: i.purchase_price, salePrice: i.sale_price, updatedBy: i.updated_by, updatedAt: i.updated_at,
});
export const mapLine = (l) => ({
  id: l.id, budgetId: l.budget_id, catalogItemId: l.catalog_item_id, kind: l.kind, name: l.name,
  category: l.category, brand: l.brand, model: l.model, sku: l.sku, unit: l.unit,
  environment: l.environment, quantity: l.quantity, purchasePrice: l.purchase_price,
  salePrice: l.sale_price, discountPercent: l.discount_percent, sortOrder: l.sort_order,
  updatedAt: l.updated_at,
});
export const mapBudget = (b, items) => ({
  id: b.id, code: b.code, client: b.client, project: b.project, status: b.status,
  validityDays: b.validity_days, discountPercent: b.discount_percent, adjustment: b.adjustment,
  notes: b.notes, createdBy: b.created_by, updatedBy: b.updated_by, createdAt: b.created_at,
  updatedAt: b.updated_at, items,
});
export function mapProposal(row, includeData = true, includePrivate = true) {
  return {
    id: row.id, code: row.code, client: row.client, project: row.project, status: row.status,
    ...(includeData ? { data: row.data ?? null, manualHtml: row.manual_html ?? "" } : {}),
    publicToken: row.public_token ?? null,
    acceptedBy: row.accepted_by ?? "",
    ...(includePrivate
      ? { acceptedEmail: row.accepted_email ?? "", acceptedDocument: row.accepted_document ?? "" }
      : {}),
    acceptedAt: row.accepted_at ?? null, createdBy: row.created_by, updatedBy: row.updated_by,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

/* ------------------------------ acessos ------------------------------ */
export async function countUsers() {
  const [row] = await sql`SELECT count(*)::int AS total FROM sona_users`;
  return row.total;
}

// Login compartilhado padrão: admin / sona01 (dono), igual ao servidor local.
export async function ensureDefaultAdmin() {
  if ((await countUsers()) > 0) return false;
  const { salt, hash } = hashPassword("sona01");
  await sql`
    INSERT INTO sona_users (id, name, email, role, salt, hash, active, created_by, created_at)
    VALUES (${randomUUID()}, 'Administrador', 'admin', 'owner', ${salt}, ${hash}, true, 'seed', ${nowIso()})
    ON CONFLICT (email) DO NOTHING`;
  return true;
}

export async function listUsers() {
  const rows = await sql`SELECT * FROM sona_users ORDER BY created_at ASC`;
  return rows.map(mapUser);
}
export async function findUserByEmail(email) {
  const rows = await sql`SELECT * FROM sona_users WHERE email = ${email} AND active = true`;
  return rows[0] || null;
}
export async function findUserById(id) {
  const rows = await sql`SELECT * FROM sona_users WHERE id = ${id}`;
  return rows[0] || null;
}
export async function emailTaken(email) {
  const [row] = await sql`SELECT count(*)::int AS total FROM sona_users WHERE email = ${email}`;
  return row.total > 0;
}
export async function insertUser({ name, email, password, role, createdBy }) {
  const { salt, hash } = hashPassword(password);
  const user = {
    id: randomUUID(), name, email, role, salt, hash, active: true,
    created_by: createdBy, created_at: nowIso(),
  };
  await sql`
    INSERT INTO sona_users (id, name, email, role, salt, hash, active, created_by, created_at)
    VALUES (${user.id}, ${user.name}, ${user.email}, ${user.role}, ${user.salt}, ${user.hash},
            true, ${user.created_by}, ${user.created_at})`;
  return user;
}
export async function updateUser(id, patch) {
  const current = await findUserById(id);
  if (!current) return null;
  const name = patch.name ?? current.name;
  const role = patch.role ?? current.role;
  const active = patch.active ?? current.active;
  const salt = patch.salt ?? current.salt;
  const hash = patch.hash ?? current.hash;
  await sql`
    UPDATE sona_users SET name = ${name}, role = ${role}, active = ${active},
      salt = ${salt}, hash = ${hash} WHERE id = ${id}`;
  return true;
}
export async function deleteUser(id) {
  await sql`DELETE FROM sona_users WHERE id = ${id}`;
}
export async function countOwners() {
  const [row] = await sql`SELECT count(*)::int AS total FROM sona_users WHERE role = 'owner'`;
  return row.total;
}

/* ------------------------------ catálogo ------------------------------ */
const CATALOG_SEED_VERSION = "2026-08-12-internal-v1";

export async function seedCatalog() {
  const [row] = await sql`SELECT count(*)::int AS total FROM sona_catalog_items`;
  const version = await getMeta("catalogSeedVersion");
  if (version === CATALOG_SEED_VERSION && row.total > 0) return false;
  const now = nowIso();
  for (const item of initialCatalog) {
    await sql`
      INSERT INTO sona_catalog_items (id, kind, name, category, brand, model, sku, system,
        description, source_url, unit, purchase_price, sale_price, updated_by, created_at, updated_at)
      VALUES (${item.id}, ${item.kind}, ${item.name}, ${item.category || ""}, ${item.brand || ""},
              ${item.model || ""}, ${item.sku || ""}, ${item.system || "UNIVERSAL"},
              ${item.description || ""}, ${item.sourceUrl || ""}, ${item.unit || "un"},
              ${item.purchasePrice || 0}, ${item.salePrice || 0},
              ${item.updatedBy || "Equipe Sona"}, ${now}, ${now})
      ON CONFLICT (id) DO NOTHING`;
  }
  await setMeta("catalogSeedVersion", CATALOG_SEED_VERSION);
  return true;
}

export async function listCatalogItems() {
  const rows = await sql`SELECT * FROM sona_catalog_items ORDER BY category ASC, name ASC`;
  return rows.map(mapCatalogItem);
}
export async function findCatalogItem(id) {
  const rows = await sql`SELECT * FROM sona_catalog_items WHERE id = ${id}`;
  return rows[0] || null;
}
export async function findCatalogItemBySku(sku) {
  const rows = await sql`SELECT * FROM sona_catalog_items WHERE sku = ${sku} AND sku <> '' LIMIT 1`;
  return rows[0] || null;
}
export async function upsertCatalogItem(v) {
  const rows = await sql`
    INSERT INTO sona_catalog_items (id, kind, name, category, brand, model, sku, system, description,
      source_url, unit, purchase_price, sale_price, updated_by, created_at, updated_at)
    VALUES (${v.id}, ${v.kind}, ${v.name}, ${v.category}, ${v.brand}, ${v.model}, ${v.sku},
            ${v.system}, ${v.description}, ${v.sourceUrl}, ${v.unit}, ${v.purchasePrice},
            ${v.salePrice}, ${v.updatedBy}, ${v.updatedAt}, ${v.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      kind = EXCLUDED.kind, name = EXCLUDED.name, category = EXCLUDED.category,
      brand = EXCLUDED.brand, model = EXCLUDED.model, sku = EXCLUDED.sku,
      system = EXCLUDED.system, description = EXCLUDED.description,
      source_url = EXCLUDED.source_url, unit = EXCLUDED.unit,
      purchase_price = EXCLUDED.purchase_price, sale_price = EXCLUDED.sale_price,
      updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at
    RETURNING *`;
  return rows[0];
}
export async function deleteCatalogItem(id) {
  await sql`DELETE FROM sona_catalog_items WHERE id = ${id}`;
}

/* ------------------------------ orçamentos ------------------------------ */
export async function listBudgetsWithItems() {
  const budgets = await sql`SELECT * FROM sona_budgets ORDER BY updated_at DESC`;
  if (!budgets.length) return [];
  const items = await sql`SELECT * FROM sona_budget_items ORDER BY sort_order ASC, created_at ASC`;
  const byBudget = new Map();
  for (const item of items) {
    if (!byBudget.has(item.budget_id)) byBudget.set(item.budget_id, []);
    byBudget.get(item.budget_id).push(mapLine(item));
  }
  return budgets.map((b) => mapBudget(b, byBudget.get(b.id) || []));
}
export async function countBudgets() {
  const [row] = await sql`SELECT count(*)::int AS total FROM sona_budgets`;
  return row.total;
}
export async function findBudget(id) {
  const rows = await sql`SELECT * FROM sona_budgets WHERE id = ${id}`;
  return rows[0] || null;
}
async function nextBudgetCode() {
  const rows = await sql`SELECT code FROM sona_budgets`;
  const highest = rows.reduce((h, b) => {
    const v = Number(String(b.code).split("-").at(-1));
    return Number.isFinite(v) ? Math.max(h, v) : h;
  }, 0);
  const now = new Date();
  const seq = String(highest + 1).padStart(3, "0");
  return `ORC-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}-${seq}`;
}
export async function createBudget(actor, client = "Novo cliente", project = "Novo projeto") {
  const now = nowIso();
  const budget = { id: randomUUID(), code: await nextBudgetCode(), client, project };
  await sql`
    INSERT INTO sona_budgets (id, code, client, project, status, validity_days, discount_percent,
      adjustment, notes, created_by, updated_by, created_at, updated_at)
    VALUES (${budget.id}, ${budget.code}, ${client}, ${project}, 'draft', 10, 0, 0, '',
            ${actor}, ${actor}, ${now}, ${now})`;
  return budget;
}
export async function updateBudget(id, patch, actor, now) {
  const current = await findBudget(id);
  if (!current) return null;
  await sql`
    UPDATE sona_budgets SET
      client = ${patch.client ?? current.client},
      project = ${patch.project ?? current.project},
      status = ${patch.status ?? current.status},
      validity_days = ${patch.validityDays ?? current.validity_days},
      discount_percent = ${patch.discountPercent ?? current.discount_percent},
      adjustment = ${patch.adjustment ?? current.adjustment},
      notes = ${patch.notes ?? current.notes},
      updated_by = ${actor}, updated_at = ${now}
    WHERE id = ${id}`;
  return true;
}
export async function touchBudget(id, actor, now) {
  await sql`UPDATE sona_budgets SET updated_by = ${actor}, updated_at = ${now} WHERE id = ${id}`;
}
export async function deleteBudget(id) {
  await sql`DELETE FROM sona_budgets WHERE id = ${id}`; // itens caem por cascade
}
export async function countBudgetItems(budgetId) {
  const [row] = await sql`SELECT count(*)::int AS total FROM sona_budget_items WHERE budget_id = ${budgetId}`;
  return row.total;
}
export async function insertBudgetItem(line) {
  await sql`
    INSERT INTO sona_budget_items (id, budget_id, catalog_item_id, kind, name, category, brand, model,
      sku, unit, environment, quantity, purchase_price, sale_price, discount_percent, sort_order,
      created_at, updated_at)
    VALUES (${line.id}, ${line.budgetId}, ${line.catalogItemId}, ${line.kind}, ${line.name},
            ${line.category}, ${line.brand}, ${line.model}, ${line.sku}, ${line.unit},
            ${line.environment}, ${line.quantity}, ${line.purchasePrice}, ${line.salePrice},
            ${line.discountPercent}, ${line.sortOrder}, ${line.createdAt}, ${line.updatedAt})`;
  return line;
}
export async function findBudgetItem(id) {
  const rows = await sql`SELECT * FROM sona_budget_items WHERE id = ${id}`;
  return rows[0] || null;
}
export async function updateBudgetItem(id, patch, now) {
  const current = await findBudgetItem(id);
  if (!current) return null;
  await sql`
    UPDATE sona_budget_items SET
      environment = ${patch.environment ?? current.environment},
      quantity = ${patch.quantity ?? current.quantity},
      purchase_price = ${patch.purchasePrice ?? current.purchase_price},
      sale_price = ${patch.salePrice ?? current.sale_price},
      discount_percent = ${patch.discountPercent ?? current.discount_percent},
      updated_at = ${now}
    WHERE id = ${id}`;
  return current;
}
export async function deleteBudgetItem(id) {
  await sql`DELETE FROM sona_budget_items WHERE id = ${id}`;
}
export async function clearBudgetItems(budgetId) {
  await sql`DELETE FROM sona_budget_items WHERE budget_id = ${budgetId}`;
}

/* ------------------------------ propostas ------------------------------ */
// A lista traz o conteúdo completo: a tela de propostas reabre um rascunho a
// partir do `data` que já veio nela (mesmo comportamento do servidor local).
export async function listProposals() {
  const rows = await sql`SELECT * FROM sona_proposals ORDER BY updated_at DESC`;
  return rows.map((r) => mapProposal(r));
}
export async function findProposalById(id) {
  const rows = await sql`SELECT * FROM sona_proposals WHERE id = ${id}`;
  return rows[0] || null;
}
export async function findProposalByCode(code) {
  const rows = await sql`SELECT * FROM sona_proposals WHERE code = ${code}`;
  return rows[0] || null;
}
export async function findProposalByToken(token) {
  const rows = await sql`SELECT * FROM sona_proposals WHERE public_token = ${token}`;
  return rows[0] || null;
}
export async function saveProposalDraft(existing, values, actor) {
  const now = values.updatedAt;
  if (existing) {
    const rows = await sql`
      UPDATE sona_proposals SET code = ${values.code}, client = ${values.client},
        project = ${values.project}, data = ${JSON.stringify(values.data)}::jsonb,
        manual_html = ${values.manualHtml}, status = 'draft', updated_by = ${actor}, updated_at = ${now}
      WHERE id = ${existing.id} RETURNING *`;
    return rows[0];
  }
  const rows = await sql`
    INSERT INTO sona_proposals (id, code, client, project, status, data, manual_html, public_token,
      accepted_by, accepted_email, accepted_document, accepted_at, created_by, updated_by,
      created_at, updated_at)
    VALUES (${randomUUID()}, ${values.code}, ${values.client}, ${values.project}, 'draft',
            ${JSON.stringify(values.data)}::jsonb, ${values.manualHtml}, NULL, '', '', '', NULL,
            ${actor}, ${actor}, ${now}, ${now})
    RETURNING *`;
  return rows[0];
}
export async function setProposalStatus(id, status, actor, now, publicToken = null) {
  const rows = publicToken
    ? await sql`
        UPDATE sona_proposals SET status = ${status}, public_token = COALESCE(public_token, ${publicToken}),
          updated_by = ${actor}, updated_at = ${now} WHERE id = ${id} RETURNING *`
    : await sql`
        UPDATE sona_proposals SET status = ${status}, updated_by = ${actor}, updated_at = ${now}
        WHERE id = ${id} RETURNING *`;
  return rows[0];
}
export async function acceptProposal(id, { name, email, document }, now) {
  const rows = await sql`
    UPDATE sona_proposals SET status = 'accepted', accepted_by = ${name}, accepted_email = ${email},
      accepted_document = ${document}, accepted_at = ${now}, updated_at = ${now}
    WHERE id = ${id} RETURNING *`;
  return rows[0];
}
export async function deleteProposal(id) {
  await sql`DELETE FROM sona_proposals WHERE id = ${id}`;
}
