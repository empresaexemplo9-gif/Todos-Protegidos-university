// Validadores e normalizadores compartilhados entre o servidor local (server/)
// e as funções serverless da Vercel (api/). Sem dependências externas.

export const clean = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const money = (v, allowNeg = false) => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : Number(v);
  const value = Number.isFinite(n) ? n : 0;
  return Math.round((allowNeg ? value : Math.max(0, value)) * 100) / 100;
};

export const bounded = (v, min, max, fb) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fb;
};

export function sanitizeHtml(v) {
  if (typeof v !== "string") return "";
  return v
    .slice(0, 1_500_000)
    .replace(/<\/?(?:script|style|iframe|object|embed|form)[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(?:javascript|data:text\/html)\s*:/gi, "");
}
