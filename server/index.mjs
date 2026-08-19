// Servidor interno da Sona: serve o app (dist/) e as APIs em /api.
// Sem dependências externas — apenas Node. Dados em data/sona-data.json.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { randomUUID } from "node:crypto";
import { root, getData, saveData } from "./store.mjs";
import { initialCatalog } from "./catalog-seed.mjs";
import { clean, money, bounded, sanitizeHtml } from "../shared/validate.mjs";
import {
  normalizeAvaConfig,
  avaFetchRecords,
  collectFields,
  mapAvaRecord,
} from "../shared/ava.mjs";
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
  parseCookies,
  SESSION_COOKIE,
} from "./auth.mjs";

const PORT = Number(process.env.PORT) || 4317;
const distDir = join(root, "dist");

/* ------------------------------ helpers ------------------------------ */
function json(res, status, obj, headers = {}) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 5_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}
async function getActor(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const uid = await verifySession(cookies[SESSION_COOKIE]);
  if (!uid) return null;
  const data = await getData();
  return data.users.find((u) => u.id === uid && u.active) || null;
}
const publicUser = (u) => (u ? { id: u.id, name: u.name, email: u.email, role: u.role } : null);
const sessionCookie = (token) =>
  `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 3600}`;
const clearCookie = `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;

// Login compartilhado padrão: admin / sona01 (dono). Pode trocar a senha e
// criar outros acessos depois, pela tela de Acessos.
function ensureDefaultAdmin(data) {
  if (data.users.length > 0) return false;
  const { salt, hash } = hashPassword("sona01");
  data.users.push({
    id: randomUUID(), name: "Administrador", email: "admin", role: "owner",
    salt, hash, active: true, createdBy: "seed", createdAt: new Date().toISOString(),
  });
  return true;
}

/* ------------------------------ mapeadores ------------------------------ */
const mapCatalogItem = (i) => ({
  id: i.id, kind: i.kind, name: i.name, category: i.category, brand: i.brand,
  model: i.model, sku: i.sku, system: i.system, description: i.description,
  sourceUrl: i.sourceUrl, unit: i.unit, purchasePrice: i.purchasePrice,
  salePrice: i.salePrice, imageUrl: i.imageUrl || "", updatedBy: i.updatedBy, updatedAt: i.updatedAt,
});
const mapLine = (l) => ({
  id: l.id, budgetId: l.budgetId, catalogItemId: l.catalogItemId, kind: l.kind,
  name: l.name, category: l.category, brand: l.brand, model: l.model, sku: l.sku,
  unit: l.unit, environment: l.environment, quantity: l.quantity,
  purchasePrice: l.purchasePrice, salePrice: l.salePrice,
  discountPercent: l.discountPercent, sortOrder: l.sortOrder, updatedAt: l.updatedAt,
});
const mapBudget = (data, b) => ({
  id: b.id, code: b.code, client: b.client, project: b.project, status: b.status,
  validityDays: b.validityDays, discountPercent: b.discountPercent, adjustment: b.adjustment,
  notes: b.notes, createdBy: b.createdBy, updatedBy: b.updatedBy,
  createdAt: b.createdAt, updatedAt: b.updatedAt,
  items: data.budgetItems
    .filter((l) => l.budgetId === b.id)
    .sort((a, c) => a.sortOrder - c.sortOrder || String(a.createdAt).localeCompare(String(c.createdAt)))
    .map(mapLine),
});
function mapProposal(row, includeData = true, includePrivate = true) {
  return {
    id: row.id, code: row.code, client: row.client, project: row.project, status: row.status,
    ...(includeData ? { data: row.data ?? null, manualHtml: row.manualHtml ?? "" } : {}),
    publicToken: row.publicToken ?? null, acceptedBy: row.acceptedBy ?? "",
    ...(includePrivate
      ? { acceptedEmail: row.acceptedEmail ?? "", acceptedDocument: row.acceptedDocument ?? "" }
      : {}),
    acceptedAt: row.acceptedAt ?? null, createdBy: row.createdBy, updatedBy: row.updatedBy,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}
/* ------------------------------ seed do catálogo ------------------------------ */
const CATALOG_SEED_VERSION = "2026-08-19-estoque-real-v1";
function seedCatalog(data) {
  if (data.meta.catalogSeedVersion === CATALOG_SEED_VERSION && data.catalogItems.length) return;
  const now = new Date().toISOString();
  const existing = new Set(data.catalogItems.map((i) => i.id));
  for (const item of initialCatalog) {
    if (existing.has(item.id)) continue;
    data.catalogItems.push({
      id: item.id, kind: item.kind, name: item.name, category: item.category, brand: item.brand,
      model: item.model, sku: item.sku, system: item.system, description: item.description,
      sourceUrl: item.sourceUrl, unit: item.unit, purchasePrice: item.purchasePrice || 0,
      salePrice: item.salePrice || 0, imageUrl: item.imageUrl || "", updatedBy: item.updatedBy || "Equipe Sona",
      createdAt: now, updatedAt: now,
    });
  }
  data.meta.catalogSeedVersion = CATALOG_SEED_VERSION;
}
function budgetCode(data) {
  const now = new Date();
  const seq = String(
    data.budgets.reduce((h, b) => {
      const v = Number(String(b.code).split("-").at(-1));
      return Number.isFinite(v) ? Math.max(h, v) : h;
    }, 0) + 1,
  ).padStart(3, "0");
  return `ORC-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}-${seq}`;
}
function createBudget(data, actor, client = "Novo cliente", project = "Novo projeto") {
  const now = new Date().toISOString();
  const budget = {
    id: randomUUID(), code: budgetCode(data), client, project, status: "draft",
    validityDays: 10, discountPercent: 0, adjustment: 0, notes: "",
    createdBy: actor, updatedBy: actor, createdAt: now, updatedAt: now,
  };
  data.budgets.push(budget);
  return budget;
}

/* ------------------------------ APIs de autenticação ------------------------------ */
async function authSession(req, res) {
  const data = await getData();
  if (ensureDefaultAdmin(data)) await saveData(data);
  const actor = await getActor(req);
  return json(res, 200, { user: publicUser(actor), needsSetup: data.users.length === 0 });
}
async function authSetup(req, res) {
  const data = await getData();
  if (data.users.length > 0) return json(res, 403, { error: "O administrador já foi criado." });
  const body = await readBody(req);
  const name = clean(body.name, 120);
  const email = clean(body.email, 180).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!name || !email || password.length < 6)
    return json(res, 400, { error: "Preencha nome, e-mail e uma senha de ao menos 6 caracteres." });
  const { salt, hash } = hashPassword(password);
  const now = new Date().toISOString();
  const user = { id: randomUUID(), name, email, role: "owner", salt, hash, active: true, createdBy: "setup", createdAt: now };
  data.users.push(user);
  await saveData(data);
  const token = await signSession(user.id);
  return json(res, 200, { user: publicUser(user) }, { "set-cookie": sessionCookie(token) });
}
async function authLogin(req, res) {
  const body = await readBody(req);
  const email = clean(body.email, 180).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const data = await getData();
  if (ensureDefaultAdmin(data)) await saveData(data);
  const user = data.users.find((u) => u.email === email && u.active);
  if (!user || !verifyPassword(password, user.salt, user.hash))
    return json(res, 401, { error: "E-mail ou senha inválidos." });
  const token = await signSession(user.id);
  return json(res, 200, { user: publicUser(user) }, { "set-cookie": sessionCookie(token) });
}
async function authLogout(_req, res) {
  return json(res, 200, { ok: true }, { "set-cookie": clearCookie });
}

/* ------------------------------ API de acessos (usuários) ------------------------------ */
async function usersApi(req, res) {
  const actor = await getActor(req);
  if (!actor || actor.role !== "owner")
    return json(res, 403, { error: "Apenas o dono pode gerenciar acessos." });
  const data = await getData();
  if (req.method === "GET") {
    return json(res, 200, {
      users: data.users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, createdAt: u.createdAt })),
    });
  }
  if (req.method === "POST") {
    const body = await readBody(req);
    if (body.action === "create") {
      const name = clean(body.name, 120);
      const email = clean(body.email, 180).toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      if (!name || !email || password.length < 6)
        return json(res, 400, { error: "Nome, e-mail e senha (mín. 6) são obrigatórios." });
      if (data.users.some((u) => u.email === email))
        return json(res, 409, { error: "Já existe um acesso com este e-mail." });
      const { salt, hash } = hashPassword(password);
      const user = { id: randomUUID(), name, email, role: body.role === "owner" ? "owner" : "member", salt, hash, active: true, createdBy: actor.email, createdAt: new Date().toISOString() };
      data.users.push(user);
      await saveData(data);
      return json(res, 200, { user: { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active } });
    }
    const id = clean(body.id, 80);
    const user = data.users.find((u) => u.id === id);
    if (!user) return json(res, 404, { error: "Acesso não encontrado." });
    if (body.action === "update") {
      if (typeof body.name === "string") user.name = clean(body.name, 120) || user.name;
      if (typeof body.active === "boolean") {
        if (user.id === actor.id && !body.active) return json(res, 400, { error: "Você não pode desativar o próprio acesso." });
        user.active = body.active;
      }
      if (typeof body.password === "string" && body.password.length >= 6) {
        const h = hashPassword(body.password);
        user.salt = h.salt;
        user.hash = h.hash;
      }
      if (body.role === "owner" || body.role === "member") user.role = body.role;
      await saveData(data);
      return json(res, 200, { ok: true });
    }
    if (body.action === "delete") {
      if (user.id === actor.id) return json(res, 400, { error: "Você não pode excluir o próprio acesso." });
      if (user.role === "owner" && data.users.filter((u) => u.role === "owner").length <= 1)
        return json(res, 400, { error: "É preciso manter ao menos um dono." });
      data.users = data.users.filter((u) => u.id !== id);
      await saveData(data);
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: "Ação inválida." });
  }
  return json(res, 405, { error: "Método não suportado." });
}

/* ------------------------------ API de propostas ------------------------------ */
async function proposalsApi(req, res, url) {
  const data = await getData();
  if (req.method === "GET") {
    const token = clean(url.searchParams.get("token"), 160);
    if (token) {
      const row = data.proposals.find((p) => p.publicToken === token);
      if (!row || row.status === "draft") return json(res, 404, { error: "Proposta não encontrada." });
      return json(res, 200, { proposal: mapProposal(row, true, false) });
    }
    const actor = await getActor(req);
    if (!actor) return json(res, 401, { error: "Acesso restrito." });
    const rows = [...data.proposals].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return json(res, 200, { proposals: rows.map((r) => mapProposal(r)) });
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
      const row = data.proposals.find((p) => p.publicToken === token);
      if (!row || row.status === "draft") return json(res, 404, { error: "Proposta não encontrada." });
      if (row.status !== "accepted") {
        const now = new Date().toISOString();
        Object.assign(row, { status: "accepted", acceptedBy: name, acceptedEmail: email, acceptedDocument: doc, acceptedAt: now, updatedAt: now });
        await saveData(data);
      }
      return json(res, 200, { proposal: mapProposal(row, true, false) });
    }
    const actor = await getActor(req);
    if (!actor) return json(res, 401, { error: "Acesso restrito." });
    const id = clean(body.id, 100);
    if (body.action === "saveDraft") {
      const code = clean(body.code, 80);
      if (!code || body.data === undefined) return json(res, 400, { error: "Dados da proposta incompletos." });
      if (JSON.stringify(body.data).length > 1_750_000)
        return json(res, 413, { error: "A proposta excedeu o limite de imagens. Remova algumas imagens ou use arquivos menores." });
      const now = new Date().toISOString();
      const values = {
        code, client: clean(body.client, 160) || "Novo cliente", project: clean(body.project, 160) || "Novo projeto",
        data: body.data, manualHtml: sanitizeHtml(body.manualHtml), status: "draft", updatedBy: actor.email, updatedAt: now,
      };
      let row = id ? data.proposals.find((p) => p.id === id) : data.proposals.find((p) => p.code === code);
      if (row) {
        Object.assign(row, values);
      } else {
        row = { id: randomUUID(), publicToken: null, acceptedBy: "", acceptedEmail: "", acceptedDocument: "", acceptedAt: null, createdBy: actor.email, createdAt: now, ...values };
        data.proposals.push(row);
      }
      await saveData(data);
      return json(res, 200, { proposal: mapProposal(row) });
    }
    if (!id) return json(res, 400, { error: "Proposta inválida." });
    const row = data.proposals.find((p) => p.id === id);
    if (!row) return json(res, 404, { error: "Proposta não encontrada." });
    if (body.action === "finalize") {
      row.status = "finalized";
      row.publicToken = row.publicToken || (randomUUID() + randomUUID()).replace(/-/g, "");
      row.updatedBy = actor.email;
      row.updatedAt = new Date().toISOString();
      await saveData(data);
      return json(res, 200, { proposal: mapProposal(row) });
    }
    if (body.action === "markSent") {
      row.status = "sent";
      row.updatedBy = actor.email;
      row.updatedAt = new Date().toISOString();
      await saveData(data);
      return json(res, 200, { proposal: mapProposal(row) });
    }
    if (body.action === "delete") {
      data.proposals = data.proposals.filter((p) => p.id !== id);
      await saveData(data);
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: "Ação inválida." });
  }
  return json(res, 405, { error: "Método não suportado." });
}

/* ------------------------------ API de orçamento / catálogo ------------------------------ */
async function budgetApi(req, res) {
  const actor = await getActor(req);
  if (!actor) return json(res, 401, { error: "Acesso restrito." });
  const data = await getData();
  const now = new Date().toISOString();

  if (req.method === "GET") {
    const before = { c: data.catalogItems.length, b: data.budgets.length, v: data.meta.catalogSeedVersion };
    seedCatalog(data);
    if (!data.budgets.length) createBudget(data, actor.email);
    if (data.catalogItems.length !== before.c || data.budgets.length !== before.b || data.meta.catalogSeedVersion !== before.v)
      await saveData(data);
    const catalogItems = [...data.catalogItems]
      .sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.name).localeCompare(String(b.name)))
      .map(mapCatalogItem);
    const budgets = [...data.budgets]
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .map((b) => mapBudget(data, b));
    return json(res, 200, { catalogItems, budgets });
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const action = body.action;

    if (action === "upsertCatalogItem") {
      const item = body.item || {};
      const name = clean(item.name, 120);
      if (!name) return json(res, 400, { error: "Informe o nome do item." });
      const kind = item.kind === "service" ? "service" : "equipment";
      const itemId = clean(item.id, 80) || randomUUID();
      const values = {
        id: itemId, kind, name, category: clean(item.category, 80), brand: clean(item.brand, 80),
        model: clean(item.model, 100), sku: clean(item.sku, 60),
        system: clean(item.system, 30).toUpperCase() || "UNIVERSAL",
        description: clean(item.description, 800), sourceUrl: clean(item.sourceUrl, 500),
        unit: clean(item.unit, 12) || (kind === "service" ? "sv" : "un"),
        purchasePrice: money(item.purchasePrice), salePrice: money(item.salePrice),
        imageUrl: clean(item.imageUrl, 800), updatedBy: actor.email, updatedAt: now,
      };
      const existing = data.catalogItems.find((c) => c.id === itemId);
      let saved;
      if (existing) {
        Object.assign(existing, values);
        saved = existing;
      } else {
        saved = { ...values, createdAt: now };
        data.catalogItems.push(saved);
      }
      await saveData(data);
      return json(res, 200, { item: mapCatalogItem(saved) });
    }
    if (action === "deleteCatalogItem") {
      const itemId = clean(body.itemId, 80);
      if (!itemId) return json(res, 400, { error: "Item inválido." });
      data.catalogItems = data.catalogItems.filter((c) => c.id !== itemId);
      await saveData(data);
      return json(res, 200, { ok: true });
    }
    if (action === "resetCatalog") {
      if (actor.role !== "owner") return json(res, 403, { error: "Apenas o dono pode restaurar o catálogo." });
      data.catalogItems = [];
      data.meta.catalogSeedVersion = "";
      seedCatalog(data);
      await saveData(data);
      return json(res, 200, { ok: true, count: data.catalogItems.length });
    }
    if (action === "createBudget") {
      const b = createBudget(data, actor.email, clean(body.budget?.client, 120) || "Novo cliente", clean(body.budget?.project, 120) || "Novo projeto");
      await saveData(data);
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
        const id = sku ? `imp-${sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}` : randomUUID();
        const values = {
          id, kind, name, category: clean(raw?.category, 80), brand: clean(raw?.brand, 80),
          model: clean(raw?.model, 100), sku,
          system: clean(raw?.system, 30).toUpperCase() || "SMARTLIFE",
          description: clean(raw?.description, 800), sourceUrl: "",
          unit: clean(raw?.unit, 12) || (kind === "service" ? "sv" : "un"),
          purchasePrice: money(raw?.purchasePrice), salePrice: money(raw?.salePrice),
          imageUrl: clean(raw?.imageUrl || raw?.image, 800), updatedBy: actor.email, updatedAt: now,
        };
        const existing = data.catalogItems.find((c) => c.id === id) || (sku ? data.catalogItems.find((c) => c.sku && c.sku === sku) : null);
        if (existing) { Object.assign(existing, values); updated++; }
        else { data.catalogItems.push({ ...values, createdAt: now }); created++; }
      }
      await saveData(data);
      return json(res, 200, { created, updated, skipped });
    }

    const budgetId = clean(body.budgetId, 80);
    if (!budgetId) return json(res, 400, { error: "Orçamento inválido." });
    const budget = data.budgets.find((b) => b.id === budgetId);
    const touchBudget = () => { if (budget) { budget.updatedBy = actor.email; budget.updatedAt = now; } };

    if (action === "updateBudget") {
      if (!budget) return json(res, 404, { error: "Orçamento não encontrado." });
      const patch = body.budget || {};
      if (patch.client !== undefined) budget.client = clean(patch.client, 120) || "Novo cliente";
      if (patch.project !== undefined) budget.project = clean(patch.project, 120) || "Novo projeto";
      if (patch.status !== undefined) budget.status = ["draft", "sent", "approved"].includes(patch.status) ? patch.status : "draft";
      if (patch.validityDays !== undefined) budget.validityDays = Math.round(bounded(patch.validityDays, 1, 365, 10));
      if (patch.discountPercent !== undefined) budget.discountPercent = bounded(patch.discountPercent, 0, 100, 0);
      if (patch.adjustment !== undefined) budget.adjustment = money(patch.adjustment, true);
      if (patch.notes !== undefined) budget.notes = clean(patch.notes, 1200);
      touchBudget();
      await saveData(data);
      return json(res, 200, { ok: true, updatedBy: actor.email });
    }
    if (action === "addBudgetItem") {
      const catItem = data.catalogItems.find((c) => c.id === clean(body.itemId, 80));
      if (!catItem) return json(res, 404, { error: "Item do catálogo não encontrado." });
      const order = data.budgetItems.filter((l) => l.budgetId === budgetId).length;
      const line = {
        id: randomUUID(), budgetId, catalogItemId: catItem.id, kind: catItem.kind, name: catItem.name,
        category: catItem.category, brand: catItem.brand, model: catItem.model, sku: catItem.sku, unit: catItem.unit,
        environment: clean(body.line?.environment, 80) || "Geral", quantity: bounded(body.line?.quantity, 0.01, 99999, 1),
        purchasePrice: catItem.purchasePrice, salePrice: catItem.salePrice, discountPercent: 0,
        sortOrder: order, createdAt: now, updatedAt: now,
      };
      data.budgetItems.push(line);
      touchBudget();
      await saveData(data);
      return json(res, 200, { line: mapLine(line) });
    }
    if (action === "updateBudgetItem") {
      const lineId = clean(body.lineId, 80);
      const line = data.budgetItems.find((l) => l.id === lineId);
      if (!line) return json(res, 400, { error: "Linha inválida." });
      const patch = body.line || {};
      if (patch.environment !== undefined) line.environment = clean(patch.environment, 80) || "Geral";
      if (patch.quantity !== undefined) line.quantity = bounded(patch.quantity, 0.01, 99999, 1);
      if (patch.purchasePrice !== undefined) line.purchasePrice = money(patch.purchasePrice);
      if (patch.salePrice !== undefined) line.salePrice = money(patch.salePrice);
      if (patch.discountPercent !== undefined) line.discountPercent = bounded(patch.discountPercent, 0, 100, 0);
      line.updatedAt = now;
      touchBudget();
      await saveData(data);
      return json(res, 200, { ok: true, updatedBy: actor.email });
    }
    if (action === "deleteBudgetItem") {
      const lineId = clean(body.lineId, 80);
      data.budgetItems = data.budgetItems.filter((l) => l.id !== lineId);
      touchBudget();
      await saveData(data);
      return json(res, 200, { ok: true });
    }
    if (action === "clearBudget") {
      data.budgetItems = data.budgetItems.filter((l) => l.budgetId !== budgetId);
      touchBudget();
      await saveData(data);
      return json(res, 200, { ok: true });
    }
    if (action === "deleteBudget") {
      data.budgets = data.budgets.filter((b) => b.id !== budgetId);
      data.budgetItems = data.budgetItems.filter((l) => l.budgetId !== budgetId);
      await saveData(data);
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: "Ação inválida." });
  }
  return json(res, 405, { error: "Método não suportado." });
}

/* ------------------------------ Integração AVA (conector configurável) ------------------------------ */
async function integracaoAvaApi(req, res) {
  const actor = await getActor(req);
  if (!actor || actor.role !== "owner") return json(res, 403, { error: "Apenas o dono pode configurar integrações." });
  const data = await getData();
  const current = data.meta.ava || {};
  if (req.method === "GET") {
    const safeHeaders = (current.headers || []).map((h) => ({ name: h.name, filled: Boolean(h.value) }));
    return json(res, 200, { config: { ...current, headers: safeHeaders }, lastSync: data.meta.avaLastSync || null });
  }
  if (req.method === "POST") {
    const body = await readBody(req);
    const config = normalizeAvaConfig(body.config, current);
    if (body.action === "save") {
      data.meta.ava = config;
      await saveData(data);
      return json(res, 200, { ok: true });
    }
    if (body.action === "test") {
      try {
        const sample = await avaFetchRecords(config, { sample: true });
        return json(res, 200, { count: sample.length, fields: sample.length ? collectFields(sample[0]) : [], sample: sample.slice(0, 2) });
      } catch (e) {
        return json(res, 400, { error: e instanceof Error ? e.message : "Falha ao testar a conexão." });
      }
    }
    if (body.action === "sync") {
      if (!config.map.name) return json(res, 400, { error: "Defina ao menos o campo do nome do produto." });
      try {
        const records = await avaFetchRecords(config, { sample: false });
        const now = new Date().toISOString();
        let created = 0, updated = 0, skipped = 0;
        for (const record of records) {
          const item = mapAvaRecord(record, config.map, actor.email, now, config.url);
          if (!item) { skipped++; continue; }
          const existing = data.catalogItems.find((c) => c.id === item.id);
          if (existing) { Object.assign(existing, item); updated++; }
          else { data.catalogItems.push({ ...item, createdAt: now }); created++; }
        }
        data.meta.ava = config;
        data.meta.avaLastSync = { at: now, fetched: records.length, created, updated, skipped };
        await saveData(data);
        return json(res, 200, { fetched: records.length, created, updated, skipped });
      } catch (e) {
        return json(res, 400, { error: e instanceof Error ? e.message : "Falha ao sincronizar." });
      }
    }
    return json(res, 400, { error: "Ação inválida." });
  }
  return json(res, 405, { error: "Método não suportado." });
}

/* ------------------------------ arquivos estáticos (SPA) ------------------------------ */
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json", ".map": "application/json", ".txt": "text/plain; charset=utf-8",
};
async function serveStatic(_req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const filePath = normalize(join(distDir, rel));
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const file = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, {
      "content-type": MIME[ext] || "application/octet-stream",
      "cache-control": ext === ".html" ? "no-cache" : "public, max-age=3600",
    });
    res.end(file);
  } catch {
    // Fallback do SPA: entrega index.html para rotas do cliente (ex.: /proposta).
    try {
      const html = await readFile(join(distDir, "index.html"));
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
      res.end(html);
    } catch {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Build não encontrado. Rode: npm run build");
    }
  }
}

/* ------------------------------ servidor ------------------------------ */
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const p = url.pathname;
    if (p.startsWith("/api/")) {
      if (p === "/api/auth/session") return await authSession(req, res);
      if (p === "/api/auth/setup") return await authSetup(req, res);
      if (p === "/api/auth/login") return await authLogin(req, res);
      if (p === "/api/auth/logout") return await authLogout(req, res);
      if (p === "/api/users") return await usersApi(req, res);
      if (p === "/api/proposals") return await proposalsApi(req, res, url);
      if (p === "/api/budget") return await budgetApi(req, res);
      if (p === "/api/integracao/ava") return await integracaoAvaApi(req, res);
      return json(res, 404, { error: "Rota não encontrada." });
    }
    if (req.method !== "GET" && req.method !== "HEAD")
      return json(res, 405, { error: "Método não suportado." });
    return await serveStatic(req, res, p);
  } catch {
    json(res, 500, { error: "Erro interno do servidor." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("  SONA Propostas — servidor interno no ar");
  console.log(`  Neste computador:  http://localhost:${PORT}`);
  console.log(`  Na mesma rede:     http://<ip-do-computador>:${PORT}  (celular/iPhone)`);
  console.log("");
});
