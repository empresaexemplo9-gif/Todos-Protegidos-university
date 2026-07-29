// ============================================================
// TODOS PROTEGIDOS — Ponte para a API do Power CRM (saída)
//
// A plataforma NÃO fala direto com a api.powercrm.com.br. Ela chama esta
// função, que guarda o token no servidor e repassa a chamada. Motivos:
//   1) o token nunca aparece no navegador;
//   2) resolve o CORS (a API do Power CRM não libera o nosso domínio);
//   3) dá para auditar tudo que sai daqui.
//
// Só entra quem está logado na plataforma (JWT do Supabase) E é
// admin/superadmin — a checagem é feita no banco, não na tela.
//
// Deploy:
//   supabase functions deploy powercrm-api
// Segredos:
//   supabase secrets set POWERCRM_API_TOKEN="o-token-da-sua-conta"
//   (opcionais, caso a API use outro formato de autenticação)
//   supabase secrets set POWERCRM_AUTH_HEADER="authorization"
//   supabase secrets set POWERCRM_AUTH_PREFIX="Bearer "
//   supabase secrets set POWERCRM_API_BASE="https://api.powercrm.com.br/api"
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const API_BASE = (Deno.env.get("POWERCRM_API_BASE") || "https://api.powercrm.com.br/api").replace(/\/+$/, "");
const API_TOKEN = Deno.env.get("POWERCRM_API_TOKEN") || "";
const AUTH_HEADER = Deno.env.get("POWERCRM_AUTH_HEADER") || "authorization";
const AUTH_PREFIX = Deno.env.get("POWERCRM_AUTH_PREFIX") ?? "Bearer ";

// Só estes caminhos podem ser chamados — evita que a ponte vire um proxy aberto.
const PERMITIDOS = [
  "quotation/add",
  "quotation/list",
  "customer/add",
  "lead/add",
];

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, apikey",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS } });

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json(405, { ok: false, error: "method not allowed" });

  // ---- 1) quem está chamando? (JWT do usuário logado) ----
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { ok: false, error: "Faça login na plataforma para usar a integração." });

  const comoUsuario = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: "Bearer " + jwt } },
  });
  const { data: userData } = await comoUsuario.auth.getUser();
  const user = userData?.user;
  if (!user) return json(401, { ok: false, error: "Sessão inválida ou expirada." });

  // ---- 2) é administrador? (consultado no banco) ----
  const { data: perfil } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const papel = perfil?.role || "consultor";
  if (papel !== "admin" && papel !== "superadmin") {
    return json(403, { ok: false, error: "Somente o administrador pode usar a integração com o Power CRM." });
  }

  if (!API_TOKEN) {
    return json(500, { ok: false, error: 'Falta o segredo POWERCRM_API_TOKEN. Defina-o em "Edge Functions → Secrets".' });
  }

  // ---- 3) o que ele quer chamar? ----
  let corpo: Record<string, unknown> = {};
  try { corpo = await req.json(); } catch { corpo = {}; }

  const caminho = String(corpo["caminho"] || corpo["path"] || "").replace(/^\/+/, "");
  const dados = (corpo["dados"] ?? corpo["body"] ?? {}) as unknown;
  const teste = corpo["teste"] === true;

  if (teste && !caminho) {
    return json(200, { ok: true, teste: true, base: API_BASE, token_configurado: true, papel: papel });
  }
  if (!caminho) return json(400, { ok: false, error: 'Informe o "caminho" da API (ex.: "quotation/add").' });
  if (!PERMITIDOS.includes(caminho)) {
    return json(400, { ok: false, error: 'Caminho não liberado: "' + caminho + '". Liberados: ' + PERMITIDOS.join(", ") + "." });
  }

  // ---- 4) repassa para o Power CRM ----
  const cabecalhos: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  cabecalhos[AUTH_HEADER.toLowerCase()] = AUTH_PREFIX + API_TOKEN;

  let resposta: Response;
  try {
    resposta = await fetch(API_BASE + "/" + caminho, {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify(dados ?? {}),
    });
  } catch (e) {
    return json(502, { ok: false, error: "Não consegui falar com a API do Power CRM: " + String(e) });
  }

  const bruto = await resposta.text();
  let retorno: unknown;
  try { retorno = bruto ? JSON.parse(bruto) : null; } catch { retorno = bruto; }

  // Guarda a chamada para auditoria (não derruba a resposta se falhar)
  try {
    const { data: tenant } = await admin.from("tenants").select("id").limit(1).maybeSingle();
    await admin.from("crm_eventos").insert({
      tenant_id: tenant?.id || null,
      tipo: "api:" + caminho + (resposta.ok ? "" : " (erro " + resposta.status + ")"),
      payload: { enviado: dados, recebido: retorno, status: resposta.status, por: user.email },
    });
  } catch { /* auditoria é acessório */ }

  return json(resposta.ok ? 200 : resposta.status, {
    ok: resposta.ok,
    status: resposta.status,
    resposta: retorno,
    error: resposta.ok ? undefined : "O Power CRM recusou a chamada (HTTP " + resposta.status + ").",
  });
});
