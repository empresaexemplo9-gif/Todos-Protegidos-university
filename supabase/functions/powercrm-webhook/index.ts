// ============================================================
// TODOS PROTEGIDOS — Webhook receiver do Power CRM
//
// Recebe os webhooks do Power CRM (cotação, cadastro, vistoria liberada,
// contrato de adesão) e grava nas tabelas crm_* do Supabase.
//
// Estratégia: SEMPRE guarda o payload bruto em crm_eventos (para auditoria e
// para refinarmos o mapeamento depois do 1º webhook real) e faz um
// mapeamento "best-effort" dos campos para as tabelas certas.
//
// Deploy:
//   supabase functions deploy powercrm-webhook --no-verify-jwt
// Secrets:
//   supabase secrets set POWERCRM_WEBHOOK_TOKEN="um-token-secreto"
//   (opcional) supabase secrets set POWERCRM_TENANT_SLUG="matriz"
// URL do webhook (configurar no Power CRM):
//   https://<PROJECT-REF>.functions.supabase.co/powercrm-webhook?token=um-token-secreto
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_TOKEN = Deno.env.get("POWERCRM_WEBHOOK_TOKEN") || "";
const TENANT_SLUG = Deno.env.get("POWERCRM_TENANT_SLUG") || "matriz";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// pega o primeiro valor definido entre vários nomes de campo (procura no topo
// e em alguns containers aninhados comuns), case-insensitive.
function field(obj: Record<string, unknown>, names: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const containers = [obj, obj["data"], obj["lead"], obj["cliente"], obj["cotacao"],
    obj["cotação"], obj["contrato"], obj["vistoria"], obj["payload"]].filter(
    (c) => c && typeof c === "object",
  ) as Record<string, unknown>[];
  for (const c of containers) {
    const lower: Record<string, unknown> = {};
    for (const k of Object.keys(c)) lower[k.toLowerCase()] = c[k];
    for (const n of names) {
      const v = lower[n.toLowerCase()];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    }
  }
  return null;
}
const numOrNull = (s: string | null) => {
  if (s == null) return null;
  const n = Number(String(s).replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", "."));
  return isFinite(n) ? n : null;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "method not allowed" });

  // ---- validação do token ----
  const url = new URL(req.url);
  const raw = await req.text();
  let body: Record<string, unknown> = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { body = { _raw: raw }; }

  const token = url.searchParams.get("token") ||
    req.headers.get("x-webhook-token") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "") ||
    (body["token"] as string) || (body["secret"] as string) || "";
  if (WEBHOOK_TOKEN && token !== WEBHOOK_TOKEN) return json(401, { ok: false, error: "invalid token" });

  // ---- tenant ----
  const { data: tenant } = await sb.from("tenants").select("id").eq("slug", TENANT_SLUG).maybeSingle();
  const tenant_id = tenant?.id || null;

  // ---- tipo do evento (best-effort) ----
  const evtRaw = (field(body, ["evento", "event", "tipo", "type", "acao", "action", "status"]) || "").toLowerCase();
  let kind = "cliente";
  const hasVistoria = !!field(body, ["link_visto", "codigo_visto", "codigo", "link"]) || evtRaw.includes("vistoria") || evtRaw.includes("visto");
  if (evtRaw.includes("contrato") || evtRaw.includes("adesao") || evtRaw.includes("adesão")) kind = "contrato";
  else if (hasVistoria) kind = "vistoria";
  else if (evtRaw.includes("cotac") || evtRaw.includes("cotaç") || field(body, ["plano", "valor", "valor_mensal"])) kind = "cotacao";

  // ---- log bruto (sempre) ----
  await sb.from("crm_eventos").insert({ tenant_id, tipo: evtRaw || kind, payload: body });

  if (!tenant_id) return json(200, { ok: true, stored: "evento", note: "tenant nao encontrado; payload bruto salvo" });

  // ---- campos comuns ----
  const externo_id = field(body, ["id", "lead_id", "cliente_id", "external_id", "id_externo", "uuid"]);
  const cliente_externo_id = field(body, ["cliente_id", "lead_id", "id_cliente", "id"]);
  const nome = field(body, ["nome", "name", "nome_completo", "cliente_nome", "nome_cliente"]);
  const telefone = field(body, ["telefone", "phone", "celular", "whatsapp", "fone"]);
  const email = field(body, ["email", "e_mail"]);
  const documento = field(body, ["documento", "cpf", "cnpj", "cpf_cnpj", "doc"]);
  const veiculo = field(body, ["veiculo", "veículo", "modelo", "carro", "moto", "veiculo_modelo"]);
  const placa = field(body, ["placa", "plate"]);
  const cidade = field(body, ["cidade", "city"]);
  const estado = field(body, ["estado", "uf", "state"]);
  const plano = field(body, ["plano", "plan", "produto"]);
  const valor = numOrNull(field(body, ["valor", "valor_mensal", "mensalidade", "price", "amount"]));
  const consultor = field(body, ["consultor", "vendedor", "responsavel", "responsável", "user", "usuario"]);
  const status = field(body, ["status", "situacao", "situação", "etapa", "stage"]);
  const now = new Date().toISOString();

  const results: Record<string, unknown> = { kind };

  // sempre tenta manter o cliente atualizado
  if (nome || telefone || email || documento || cliente_externo_id) {
    const r = await sb.from("crm_clientes").upsert({
      tenant_id, externo_id: cliente_externo_id || externo_id, nome, telefone, email,
      documento, veiculo, placa, cidade, estado, consultor, status, atualizado_em: now,
    }, { onConflict: "tenant_id,externo_id" });
    results.cliente = r.error ? r.error.message : "ok";
  }

  if (kind === "cotacao") {
    const r = await sb.from("crm_cotacoes").upsert({
      tenant_id, externo_id, cliente_externo_id, nome, veiculo, placa, plano, valor,
      status: status || evtRaw || "nova", consultor, atualizado_em: now,
    }, { onConflict: "tenant_id,externo_id" });
    results.cotacao = r.error ? r.error.message : "ok";
  } else if (kind === "vistoria") {
    const r = await sb.from("crm_vistorias").upsert({
      tenant_id, externo_id, cliente_externo_id, nome, veiculo, placa,
      link_visto: field(body, ["link_visto", "link", "url_vistoria", "url"]),
      codigo_visto: field(body, ["codigo_visto", "codigo", "code", "codigo_vistoria"]),
      status: status || evtRaw || "liberada", consultor, atualizado_em: now,
    }, { onConflict: "tenant_id,externo_id" });
    results.vistoria = r.error ? r.error.message : "ok";
  } else if (kind === "contrato") {
    const r = await sb.from("crm_contratos").upsert({
      tenant_id, externo_id, cliente_externo_id, nome, plano, valor,
      status: status || evtRaw || "gerado",
      url: field(body, ["url", "link", "url_contrato", "link_contrato", "pdf"]),
      consultor, atualizado_em: now,
    }, { onConflict: "tenant_id,externo_id" });
    results.contrato = r.error ? r.error.message : "ok";
  }

  return json(200, { ok: true, ...results });
});
