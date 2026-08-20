import test from "node:test";
import assert from "node:assert/strict";
import { generateProposalImage, OpenAIImageError } from "../shared/openai-image.mjs";

test("exige a chave da OpenAI", async () => {
  await assert.rejects(
    () => generateProposalImage("Sala moderna", { apiKey: "" }),
    (error) => error instanceof OpenAIImageError && error.status === 503 && error.code === "missing_api_key",
  );
});

test("gera WebP horizontal e devolve data URL", async () => {
  let request;
  const result = await generateProposalImage("Sala de cinema residencial sofisticada", {
    apiKey: "sk-test",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ data: [{ b64_json: "a".repeat(120) }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  assert.equal(request.url, "https://api.openai.com/v1/images/generations");
  assert.equal(request.options.headers.authorization, "Bearer sk-test");
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, "gpt-image-2");
  assert.equal(body.size, "1536x1024");
  assert.equal(body.quality, "medium");
  assert.equal(body.output_format, "webp");
  assert.equal(body.output_compression, 60);
  assert.match(body.prompt, /Sala de cinema residencial sofisticada/);
  assert.equal(result.image, `data:image/webp;base64,${"a".repeat(120)}`);
});

test("traduz chave recusada em mensagem segura", async () => {
  await assert.rejects(
    () => generateProposalImage("Sala moderna", {
      apiKey: "sk-invalid",
      fetchImpl: async () => new Response(JSON.stringify({ error: { code: "invalid_api_key" } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    }),
    (error) => error instanceof OpenAIImageError && error.status === 503 && error.code === "invalid_api_key",
  );
});
