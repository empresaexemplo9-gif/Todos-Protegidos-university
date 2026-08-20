const OPENAI_IMAGE_ENDPOINT = "https://api.openai.com/v1/images/generations";
const DEFAULT_MODEL = "gpt-image-1";

export class OpenAIImageError extends Error {
  constructor(message, status = 500, code = "openai_error") {
    super(message);
    this.name = "OpenAIImageError";
    this.status = status;
    this.code = code;
  }
}

const commercialPrompt = (prompt) => [
  "Crie uma imagem horizontal premium para uma proposta comercial de tecnologia e automação.",
  "A composição deve ser sofisticada, realista, limpa e adequada a uma apresentação para cliente.",
  "Não inclua logotipos, marcas d'água, molduras, legendas ou textos na imagem.",
  `Cena solicitada: ${prompt}`,
].join(" ");

function upstreamErrorMessage(status, payload) {
  const code = payload?.error?.code || payload?.error?.type || "openai_error";
  if (code === "moderation_blocked") {
    return new OpenAIImageError("O pedido foi bloqueado pelos filtros de segurança. Ajuste a descrição e tente novamente.", 400, code);
  }
  if (status === 401) {
    return new OpenAIImageError("A chave da OpenAI foi recusada. Atualize o segredo OPENAI_API_KEY no servidor.", 503, code);
  }
  if (status === 403) {
    return new OpenAIImageError("A conta da OpenAI ainda não está habilitada para gerar imagens. Confira a verificação da organização e as permissões do projeto.", 403, code);
  }
  if (status === 429) {
    return new OpenAIImageError("O limite da OpenAI foi atingido. Confira os créditos e tente novamente em alguns instantes.", 429, code);
  }
  if (status >= 500) {
    return new OpenAIImageError("A OpenAI está temporariamente indisponível. Tente novamente em alguns instantes.", 502, code);
  }
  return new OpenAIImageError("Não foi possível gerar a imagem. Revise a descrição e tente novamente.", 400, code);
}

export async function generateProposalImage(prompt, options = {}) {
  const apiKey = (options.apiKey ?? process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new OpenAIImageError("A geração por IA ainda não está configurada. Cadastre OPENAI_API_KEY no servidor.", 503, "missing_api_key");
  }

  const cleanPrompt = typeof prompt === "string" ? prompt.trim().slice(0, 1800) : "";
  if (cleanPrompt.length < 5) {
    throw new OpenAIImageError("Descreva a imagem que deseja gerar.", 400, "invalid_prompt");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 115_000);
  let response;
  try {
    response = await fetchImpl(OPENAI_IMAGE_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: (process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL).trim(),
        prompt: commercialPrompt(cleanPrompt),
        size: "1536x1024",
        quality: "medium",
        output_format: "webp",
        output_compression: 60,
        n: 1,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new OpenAIImageError("A geração demorou mais que o esperado. Tente novamente.", 504, "timeout");
    }
    throw new OpenAIImageError("Não foi possível alcançar a OpenAI. Tente novamente.", 502, "network_error");
  } finally {
    clearTimeout(timeout);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // A mensagem segura abaixo cobre respostas incompletas do provedor.
  }
  if (!response.ok) {
    const requestId = response.headers?.get?.("x-request-id");
    console.error("OpenAI image generation failed", { status: response.status, code: payload?.error?.code, requestId });
    throw upstreamErrorMessage(response.status, payload);
  }

  const base64 = payload?.data?.[0]?.b64_json;
  if (typeof base64 !== "string" || base64.length < 100) {
    throw new OpenAIImageError("A OpenAI respondeu sem uma imagem. Tente novamente.", 502, "empty_image");
  }

  return {
    image: `data:image/webp;base64,${base64}`,
    model: payload?.model || process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL,
  };
}
