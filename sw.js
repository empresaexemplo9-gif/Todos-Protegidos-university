// Todos Protegidos University — Service Worker (PWA)
// Estratégia: NETWORK-FIRST (sempre tenta a versão mais nova online; cache só
// como reserva offline). Evita servir conteúdo desatualizado.
var CACHE = "tp-univ-v1";

self.addEventListener("install", function (e) { self.skipWaiting(); });

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  // Só lida com requisições do próprio site (não interfere no Supabase/CDN).
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      try {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      } catch (err) {}
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match("./dashboard.html");
      });
    })
  );
});
