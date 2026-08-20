import { ensureSchema } from "../../lib/db.js";
import { getActor } from "../../lib/auth.js";
import { json, readBody } from "../../lib/http.js";
import { searchImages, ImageSearchError } from "../../shared/google-image.mjs";

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const actor = await getActor(req);
    if (!actor) return json(res, 401, { error: "Acesso restrito." });

    if (req.method === "GET") {
      return json(res, 200, { configured: Boolean((process.env.GOOGLE_CSE_KEY || "").trim()) && Boolean((process.env.GOOGLE_CSE_ID || "").trim()) });
    }
    if (req.method !== "POST") return json(res, 405, { error: "Método não suportado." });

    const body = await readBody(req);
    return json(res, 200, await searchImages(body.q, { count: body.count }));
  } catch (error) {
    if (error instanceof ImageSearchError) {
      return json(res, error.status, { error: error.message, code: error.code });
    }
    console.error("Unexpected image search error", error);
    return json(res, 500, { error: "Erro interno na busca de imagens." });
  }
}
