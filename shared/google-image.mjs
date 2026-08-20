// Busca e importação de imagens reais da web via Google Custom Search (JSON API).
// A busca devolve candidatos (miniatura + URL); a importação baixa a imagem
// escolhida no servidor e devolve um data URL, para embutir e persistir como
// qualquer outra imagem da proposta (sem depender de link externo no futuro).
const GOOGLE_CSE_ENDPOINT = "https://www.googleapis.com/customsearch/v1";
const MAX_IMAGE_BYTES = 8_000_000;

export class ImageSearchError extends Error {
  constructor(message, status = 500, code = "search_error") {
    super(message);
    this.name = "ImageSearchError";
    this.status = status;
    this.code = code;
  }
}

export async function searchImages(query, options = {}) {
  const key = (options.key ?? process.env.GOOGLE_CSE_KEY ?? "").trim();
  const cx = (options.cx ?? process.env.GOOGLE_CSE_ID ?? "").trim();
  if (!key || !cx) {
    throw new ImageSearchError("A busca de imagens ainda não está configurada. Cadastre GOOGLE_CSE_KEY e GOOGLE_CSE_ID no servidor.", 503, "missing_config");
  }
  const q = typeof query === "string" ? query.trim().slice(0, 200) : "";
  if (q.length < 2) {
    throw new ImageSearchError("Descreva o que deseja buscar.", 400, "invalid_query");
  }
  const count = Math.min(10, Math.max(1, Number(options.count) || 9));
  // Modo "foto oficial": prioriza a imagem de catálogo do fabricante — foto real,
  // de fundo branco — reforçando o termo e usando os filtros do Google.
  const official = options.official ?? false;
  const effectiveQuery = official ? `${q} official product photo` : q;
  const params = new URLSearchParams({ key, cx, q: effectiveQuery, searchType: "image", num: String(count), safe: "active" });
  if (official) {
    params.set("imgType", "photo");
    params.set("imgDominantColor", "white");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
  let response;
  try {
    response = await fetchImpl(`${GOOGLE_CSE_ENDPOINT}?${params.toString()}`, { signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") throw new ImageSearchError("A busca demorou mais que o esperado. Tente novamente.", 504, "timeout");
    throw new ImageSearchError("Não foi possível alcançar o Google. Tente novamente.", 502, "network_error");
  } finally {
    clearTimeout(timeout);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Mensagem segura abaixo cobre respostas incompletas.
  }
  if (!response.ok) {
    if (response.status === 403) throw new ImageSearchError("A busca do Google foi recusada (cota diária esgotada ou Custom Search não habilitado). Confira a chave e o mecanismo de busca.", 403, "quota_or_disabled");
    if (response.status === 400) throw new ImageSearchError("Configuração da busca inválida. Revise GOOGLE_CSE_KEY e GOOGLE_CSE_ID.", 400, "bad_config");
    throw new ImageSearchError("Não foi possível buscar imagens agora. Tente novamente.", 502, "upstream_error");
  }

  const items = Array.isArray(payload?.items) ? payload.items : [];
  const results = items
    .map((item) => ({
      title: typeof item?.title === "string" ? item.title.slice(0, 120) : "",
      image: item?.link,
      thumbnail: item?.image?.thumbnailLink ?? item?.link,
      width: item?.image?.width ?? null,
      height: item?.image?.height ?? null,
      context: item?.image?.contextLink ?? null,
    }))
    .filter((entry) => typeof entry.image === "string" && /^https:\/\//i.test(entry.image));
  return { results };
}

export async function importImage(url, options = {}) {
  const target = typeof url === "string" ? url.trim() : "";
  // Só https e só conteúdo de imagem: evita SSRF para esquemas internos e respostas não-imagem.
  if (!/^https:\/\//i.test(target)) {
    throw new ImageSearchError("Endereço de imagem inválido.", 400, "invalid_url");
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
  let response;
  try {
    response = await fetchImpl(target, { signal: controller.signal, headers: { accept: "image/*" } });
  } catch (error) {
    if (error?.name === "AbortError") throw new ImageSearchError("A imagem demorou para baixar. Tente outra.", 504, "timeout");
    throw new ImageSearchError("Não foi possível baixar essa imagem. Tente outra.", 502, "network_error");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ImageSearchError("Não foi possível baixar essa imagem. Tente outra.", 502, "download_failed");
  }
  const type = (response.headers?.get?.("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!type.startsWith("image/")) {
    throw new ImageSearchError("O endereço não aponta para uma imagem. Tente outra.", 415, "not_image");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new ImageSearchError("A imagem veio vazia. Tente outra.", 502, "empty_image");
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ImageSearchError("A imagem é grande demais. Escolha outra.", 413, "too_large");
  }
  return { image: `data:${type};base64,${buffer.toString("base64")}`, type };
}
