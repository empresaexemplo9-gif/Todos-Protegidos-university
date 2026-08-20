import test from "node:test";
import assert from "node:assert/strict";
import { searchImages, importImage, ImageSearchError } from "../shared/google-image.mjs";

test("exige configuração do Google Custom Search", async () => {
  await assert.rejects(
    () => searchImages("rack de automação", { key: "", cx: "" }),
    (error) => error instanceof ImageSearchError && error.status === 503 && error.code === "missing_config",
  );
});

test("busca imagens e normaliza os resultados", async () => {
  let request;
  const result = await searchImages("rack de automação", {
    key: "k", cx: "c",
    fetchImpl: async (url) => {
      request = url;
      return new Response(JSON.stringify({ items: [
        { title: "Rack", link: "https://ex.com/a.jpg", image: { thumbnailLink: "https://ex.com/t.jpg", width: 800, height: 600, contextLink: "https://ex.com" } },
        { title: "Inseguro", link: "http://ex.com/b.jpg" },
      ] }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });
  assert.match(request, /customsearch\/v1\?/);
  assert.match(request, /searchType=image/);
  assert.equal(result.results.length, 1); // descarta o link http://
  assert.equal(result.results[0].image, "https://ex.com/a.jpg");
  assert.equal(result.results[0].thumbnail, "https://ex.com/t.jpg");
});

test("modo foto oficial aplica filtros de produto (foto, fundo branco)", async () => {
  let request;
  await searchImages("UniFi U7 Pro", {
    key: "k", cx: "c", official: true,
    fetchImpl: async (url) => { request = url; return new Response(JSON.stringify({ items: [] }), { status: 200, headers: { "content-type": "application/json" } }); },
  });
  assert.match(request, /imgType=photo/);
  assert.match(request, /imgDominantColor=white/);
  assert.match(request, /official\+product\+photo/);
});

test("traduz cota esgotada em mensagem segura", async () => {
  await assert.rejects(
    () => searchImages("teste", { key: "k", cx: "c", fetchImpl: async () => new Response("{}", { status: 403, headers: { "content-type": "application/json" } }) }),
    (error) => error instanceof ImageSearchError && error.status === 403 && error.code === "quota_or_disabled",
  );
});

test("importa imagem https como data URL", async () => {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const result = await importImage("https://ex.com/a.png", {
    fetchImpl: async () => new Response(bytes, { status: 200, headers: { "content-type": "image/png" } }),
  });
  assert.match(result.image, /^data:image\/png;base64,/);
});

test("recusa URL não-https na importação", async () => {
  await assert.rejects(
    () => importImage("http://ex.com/a.png"),
    (error) => error instanceof ImageSearchError && error.status === 400 && error.code === "invalid_url",
  );
});

test("recusa conteúdo que não é imagem", async () => {
  await assert.rejects(
    () => importImage("https://ex.com/page.html", { fetchImpl: async () => new Response("<html>", { status: 200, headers: { "content-type": "text/html" } }) }),
    (error) => error instanceof ImageSearchError && error.status === 415 && error.code === "not_image",
  );
});
