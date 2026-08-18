// Importa os dados do arquivo local (data/sona-data.json) para o Postgres da
// nuvem, preservando ids. Serve para levar o que já existe no computador — ou um
// backup exportado — para a versão publicada.
//
//   DATABASE_URL="postgres://..." node tools/importar-dados.mjs [arquivo.json]
//
// A URL é a mesma DATABASE_URL do painel da Vercel (Settings → Environment
// Variables). Rodar duas vezes é seguro: os registros são atualizados pelo id.
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sql, ensureSchema, setMeta } from "../lib/db.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const file = resolve(process.argv[2] || join(root, "data", "sona-data.json"));
const nowIso = () => new Date().toISOString();
const str = (v, fb = "") => (typeof v === "string" ? v : v == null ? fb : String(v));
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const data = JSON.parse(await readFile(file, "utf8"));
const counts = { users: 0, catalogItems: 0, budgets: 0, budgetItems: 0, proposals: 0 };

await ensureSchema();

for (const u of data.users || []) {
  if (!u?.id || !u?.email || !u?.salt || !u?.hash) continue;
  await sql`
    INSERT INTO sona_users (id, name, email, role, salt, hash, active, created_by, created_at)
    VALUES (${u.id}, ${str(u.name)}, ${str(u.email)}, ${u.role === "owner" ? "owner" : "member"},
            ${u.salt}, ${u.hash}, ${u.active !== false}, ${str(u.createdBy)}, ${str(u.createdAt, nowIso())})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role,
      salt = EXCLUDED.salt, hash = EXCLUDED.hash, active = EXCLUDED.active`;
  counts.users++;
}

for (const i of data.catalogItems || []) {
  if (!i?.id || !i?.name) continue;
  await sql`
    INSERT INTO sona_catalog_items (id, kind, name, category, brand, model, sku, system, description,
      source_url, unit, purchase_price, sale_price, updated_by, created_at, updated_at)
    VALUES (${i.id}, ${i.kind === "service" ? "service" : "equipment"}, ${str(i.name)},
            ${str(i.category)}, ${str(i.brand)}, ${str(i.model)}, ${str(i.sku)},
            ${str(i.system, "UNIVERSAL")}, ${str(i.description)}, ${str(i.sourceUrl)},
            ${str(i.unit, "un")}, ${num(i.purchasePrice)}, ${num(i.salePrice)},
            ${str(i.updatedBy)}, ${str(i.createdAt, nowIso())}, ${str(i.updatedAt, nowIso())})
    ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, name = EXCLUDED.name,
      category = EXCLUDED.category, brand = EXCLUDED.brand, model = EXCLUDED.model,
      sku = EXCLUDED.sku, system = EXCLUDED.system, description = EXCLUDED.description,
      source_url = EXCLUDED.source_url, unit = EXCLUDED.unit,
      purchase_price = EXCLUDED.purchase_price, sale_price = EXCLUDED.sale_price,
      updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at`;
  counts.catalogItems++;
}

for (const b of data.budgets || []) {
  if (!b?.id) continue;
  await sql`
    INSERT INTO sona_budgets (id, code, client, project, status, validity_days, discount_percent,
      adjustment, notes, created_by, updated_by, created_at, updated_at)
    VALUES (${b.id}, ${str(b.code)}, ${str(b.client, "Novo cliente")}, ${str(b.project, "Novo projeto")},
            ${str(b.status, "draft")}, ${Math.round(num(b.validityDays) || 10)}, ${num(b.discountPercent)},
            ${num(b.adjustment)}, ${str(b.notes)}, ${str(b.createdBy)}, ${str(b.updatedBy)},
            ${str(b.createdAt, nowIso())}, ${str(b.updatedAt, nowIso())})
    ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, client = EXCLUDED.client,
      project = EXCLUDED.project, status = EXCLUDED.status, validity_days = EXCLUDED.validity_days,
      discount_percent = EXCLUDED.discount_percent, adjustment = EXCLUDED.adjustment,
      notes = EXCLUDED.notes, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at`;
  counts.budgets++;
}

for (const l of data.budgetItems || []) {
  if (!l?.id || !l?.budgetId) continue;
  await sql`
    INSERT INTO sona_budget_items (id, budget_id, catalog_item_id, kind, name, category, brand, model,
      sku, unit, environment, quantity, purchase_price, sale_price, discount_percent, sort_order,
      created_at, updated_at)
    VALUES (${l.id}, ${l.budgetId}, ${l.catalogItemId ?? null},
            ${l.kind === "service" ? "service" : "equipment"}, ${str(l.name)}, ${str(l.category)},
            ${str(l.brand)}, ${str(l.model)}, ${str(l.sku)}, ${str(l.unit, "un")},
            ${str(l.environment, "Geral")}, ${num(l.quantity) || 1}, ${num(l.purchasePrice)},
            ${num(l.salePrice)}, ${num(l.discountPercent)}, ${Math.round(num(l.sortOrder))},
            ${str(l.createdAt, nowIso())}, ${str(l.updatedAt, nowIso())})
    ON CONFLICT (id) DO UPDATE SET environment = EXCLUDED.environment, quantity = EXCLUDED.quantity,
      purchase_price = EXCLUDED.purchase_price, sale_price = EXCLUDED.sale_price,
      discount_percent = EXCLUDED.discount_percent, sort_order = EXCLUDED.sort_order,
      updated_at = EXCLUDED.updated_at`;
  counts.budgetItems++;
}

for (const p of data.proposals || []) {
  if (!p?.id || !p?.code) continue;
  await sql`
    INSERT INTO sona_proposals (id, code, client, project, status, data, manual_html, public_token,
      accepted_by, accepted_email, accepted_document, accepted_at, created_by, updated_by,
      created_at, updated_at)
    VALUES (${p.id}, ${str(p.code)}, ${str(p.client, "Novo cliente")}, ${str(p.project, "Novo projeto")},
            ${str(p.status, "draft")}, ${JSON.stringify(p.data ?? null)}::jsonb, ${str(p.manualHtml)},
            ${p.publicToken || null}, ${str(p.acceptedBy)}, ${str(p.acceptedEmail)},
            ${str(p.acceptedDocument)}, ${p.acceptedAt || null}, ${str(p.createdBy)},
            ${str(p.updatedBy)}, ${str(p.createdAt, nowIso())}, ${str(p.updatedAt, nowIso())})
    ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, client = EXCLUDED.client,
      project = EXCLUDED.project, status = EXCLUDED.status, data = EXCLUDED.data,
      manual_html = EXCLUDED.manual_html, public_token = EXCLUDED.public_token,
      accepted_by = EXCLUDED.accepted_by, accepted_email = EXCLUDED.accepted_email,
      accepted_document = EXCLUDED.accepted_document, accepted_at = EXCLUDED.accepted_at,
      updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at`;
  counts.proposals++;
}

for (const [key, value] of Object.entries(data.meta || {})) {
  if (key === "session_secret") continue; // o segredo da nuvem é próprio
  await setMeta(key, value);
}

console.log(`Importado de ${file}:`);
for (const [key, value] of Object.entries(counts)) console.log(`  ${key}: ${value}`);
console.log("Pronto. Recarregue a plataforma publicada para ver os dados.");
