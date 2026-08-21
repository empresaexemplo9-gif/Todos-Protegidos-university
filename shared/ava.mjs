// Conector configurável do AVA (leitura de produtos via API do próprio AVA).
// Compartilhado entre o servidor local e as funções serverless.
import { randomUUID } from "node:crypto";
import { clean } from "./validate.mjs";
import { normalizeCatalogItem } from "./catalog-classification.mjs";

export function getByPath(obj, path) {
  if (!path) return obj;
  return String(path).split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function pickArray(payload, listPath) {
  const direct = listPath ? getByPath(payload, listPath) : payload;
  const scan = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      for (const key of Object.keys(value)) if (Array.isArray(value[key])) return value[key];
    }
    return null;
  };
  return scan(direct) || scan(payload) || [];
}

export function collectFields(obj, prefix = "", out = [], depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 2) return out;
  for (const key of Object.keys(obj)) {
    if (out.length >= 120) break;
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val && typeof val === "object" && !Array.isArray(val)) collectFields(val, path, out, depth + 1);
    else out.push(path);
  }
  return out;
}

export function avaNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let s = String(value ?? "").trim().replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeAvaConfig(input, prev = {}) {
  input = input || {};
  const prevByName = {};
  for (const h of prev.headers || []) prevByName[h.name] = h.value;
  const headers = (Array.isArray(input.headers) ? input.headers : [])
    .map((h) => {
      const name = clean(h?.name, 80);
      let value = typeof h?.value === "string" ? h.value : "";
      if (!value && h?.filled) value = prevByName[name] || "";
      return { name, value };
    })
    .filter((h) => h.name);
  const map = input.map || {};
  return {
    url: clean(input.url, 600),
    method: input.method === "POST" ? "POST" : "GET",
    body: typeof input.body === "string" ? input.body.slice(0, 4000) : "",
    headers,
    listPath: clean(input.listPath, 160),
    pageParam: clean(input.pageParam, 60),
    pageSizeParam: clean(input.pageSizeParam, 60),
    pageSize: Math.max(0, Number(input.pageSize) || 0),
    pageStart: Number.isFinite(Number(input.pageStart)) ? Number(input.pageStart) : 1,
    maxPages: Math.min(500, Math.max(1, Number(input.maxPages) || 50)),
    map: {
      name: clean(map.name, 160), sku: clean(map.sku, 160), brand: clean(map.brand, 160),
      model: clean(map.model, 160), category: clean(map.category, 160), unit: clean(map.unit, 160),
      purchasePrice: clean(map.purchasePrice, 160), salePrice: clean(map.salePrice, 160),
      description: clean(map.description, 160), image: clean(map.image, 160),
    },
  };
}

function avaRequestHeaders(config) {
  const headers = { accept: "application/json" };
  for (const h of config.headers || []) if (h.name) headers[h.name] = h.value ?? "";
  return headers;
}

async function avaFetchPage(config, pageValue) {
  let url = config.url;
  const method = config.method || "GET";
  const headers = avaRequestHeaders(config);
  let body;
  if (config.pageParam && pageValue != null) {
    const u = new URL(url);
    u.searchParams.set(config.pageParam, String(pageValue));
    if (config.pageSizeParam && config.pageSize) u.searchParams.set(config.pageSizeParam, String(config.pageSize));
    url = u.toString();
  }
  if (method === "POST" && config.body) {
    headers["content-type"] = headers["content-type"] || "application/json";
    body = config.body;
  }
  const response = await fetch(url, { method, headers, body });
  const text = await response.text();
  if (!response.ok) throw new Error(`O AVA respondeu ${response.status}. ${text.slice(0, 240)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("A resposta do AVA não veio em JSON. Confira a URL e a autenticação.");
  }
}

export async function avaFetchRecords(config, { sample = false } = {}) {
  if (!config.url) throw new Error("Informe a URL do endpoint de produtos do AVA.");
  const records = [];
  if (config.pageParam) {
    const pages = sample ? 1 : config.maxPages;
    for (let i = 0; i < pages; i++) {
      const arr = pickArray(await avaFetchPage(config, config.pageStart + i), config.listPath);
      if (!arr.length) break;
      records.push(...arr);
      if (sample) break;
      if (config.pageSize && arr.length < config.pageSize) break;
    }
  } else {
    records.push(...pickArray(await avaFetchPage(config, null), config.listPath));
  }
  return records;
}

export function mapAvaRecord(record, map, actor, now, baseUrl = "") {
  const get = (path) => (path ? getByPath(record, path) : "");
  const name = clean(String(get(map.name) ?? ""), 120);
  if (!name) return null;
  const sku = clean(String(get(map.sku) ?? ""), 60);
  const rawImage = clean(String(get(map.image) ?? ""), 800);
  let imageUrl = rawImage;
  if (rawImage && !/^https?:|^data:/i.test(rawImage) && baseUrl) {
    try { imageUrl = new URL(rawImage, baseUrl).toString(); } catch { imageUrl = rawImage; }
  }
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return normalizeCatalogItem({
    id: `ava-${sku || slug || randomUUID().slice(0, 8)}`,
    kind: "equipment",
    name,
    category: clean(String(get(map.category) ?? ""), 80) || "AVA",
    brand: clean(String(get(map.brand) ?? ""), 80),
    model: clean(String(get(map.model) ?? ""), 100),
    sku,
    system: "AVA",
    description: clean(String(get(map.description) ?? ""), 800),
    sourceUrl: "",
    imageUrl,
    unit: clean(String(get(map.unit) ?? ""), 12) || "un",
    purchasePrice: map.purchasePrice ? avaNumber(get(map.purchasePrice)) : 0,
    salePrice: map.salePrice ? avaNumber(get(map.salePrice)) : 0,
    updatedBy: actor,
    updatedAt: now,
  });
}
