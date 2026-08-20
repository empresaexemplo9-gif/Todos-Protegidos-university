import { ensureSchema } from "../../lib/db.js";
import { getActor } from "../../lib/auth.js";
import { json, readBody } from "../../lib/http.js";
import { generateProposalImage, OpenAIImageError } from "../../shared/openai-image.mjs";

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const actor = await getActor(req);
    if (!actor) return json(res, 401, { error: "Acesso restrito." });

    if (req.method === "GET") {
      return json(res, 200, {
        configured: Boolean((process.env.OPENAI_API_KEY || "").trim()),
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      });
    }
    if (req.method !== "POST") return json(res, 405, { error: "Método não suportado." });

    const body = await readBody(req);
    const result = await generateProposalImage(body.prompt);
    return json(res, 200, result);
  } catch (error) {
    if (error instanceof OpenAIImageError) {
      return json(res, error.status, { error: error.message, code: error.code });
    }
    console.error("Unexpected AI image error", error);
    return json(res, 500, { error: "Erro interno ao gerar a imagem." });
  }
}
