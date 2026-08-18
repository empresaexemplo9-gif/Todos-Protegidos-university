// Utilidades de requisição/resposta para as funções serverless da Vercel.
export { clean, money, bounded, sanitizeHtml } from "../shared/validate.mjs";

export function json(res, status, obj, headers = {}) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(obj));
}

// A Vercel já entrega o corpo em req.body quando o content-type é JSON;
// o fallback cobre chamadas fora desse caminho (ex.: execução local).
export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return req.body ? JSON.parse(req.body) : {};
    } catch {
      return {};
    }
  }
  return await new Promise((resolve) => {
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

export function failure(res, error) {
  const message = error instanceof Error ? error.message : "Erro interno do servidor.";
  const isConfig = message.includes("Banco de dados não configurado");
  return json(res, isConfig ? 503 : 500, {
    error: isConfig ? message : "Erro interno do servidor. Tente novamente.",
  });
}
