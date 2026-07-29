// ============================================================
// TODOS PROTEGIDOS — Leitor de links de planilha do Google
// ------------------------------------------------------------
// Aceita qualquer link (edição, compartilhamento, Drive ou CSV pronto) e
// devolve os endereços CSV a tentar, em ordem. Usado pelo Painel regional
// e pelo Financeiro.
// ============================================================
(function () {
  "use strict";

  // Aceita qualquer link da planilha: o de edição (…/d/<ID>/edit), o publicado
  // (…/d/e/<ID>/pub) ou o CSV direto. Devolve os endereços CSV a tentar, em ordem.
  function analisarLink(url) {
    var u = String(url || "").trim();
    if (!u) return { vazio: true, csv: [] };
    var r = { url: u, xlsx: /[?&]rtpof=true/i.test(u), gid: "" };
    var mg = u.match(/[?&#]gid=([0-9]+)/);
    if (mg) r.gid = mg[1];

    // já é um endereço CSV pronto
    if (/output=csv|format=csv|tqx=out:csv/i.test(u)) { r.tipo = "csv"; r.csv = [u]; return r; }

    // link "Publicar na web" (…/spreadsheets/d/e/2PACX…/pub…)
    var mp = u.match(/\/spreadsheets\/d\/e\/([^/?#]+)/);
    if (mp) {
      r.tipo = "publicado"; r.pubId = mp[1];
      r.csv = ["https://docs.google.com/spreadsheets/d/e/" + mp[1] + "/pub?single=true&output=csv" +
               (r.gid ? "&gid=" + r.gid : "")];
      return r;
    }

    // link normal do arquivo (…/spreadsheets/d/<ID>/edit… ou …/file/d/<ID>/…)
    var md = u.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/) ||
             u.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/) ||
             u.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    if (md) {
      r.tipo = "arquivo"; r.id = md[1];
      var g = r.gid || "0";
      r.csv = [
        "https://docs.google.com/spreadsheets/d/" + r.id + "/gviz/tq?tqx=out:csv&gid=" + g,
        "https://docs.google.com/spreadsheets/d/" + r.id + "/export?format=csv&gid=" + g
      ];
      return r;
    }
    r.tipo = "outro"; r.csv = [u];
    return r;
  }


  window.TPLinkPlanilha = analisarLink;
})();
