// ============================================================
// TODOS PROTEGIDOS — Motor de gráficos em SVG puro
// ------------------------------------------------------------
// Sem biblioteca nenhuma: o site não tem build, então cada gráfico é
// SVG montado na mão. Usado pelo Painel regional e pelo Financeiro.
//
// Caixa fixa em viewBox + preserveAspectRatio: nada é esticado, então
// texto e cantos arredondados saem sempre nítidos em qualquer largura.
// ============================================================
(function () {
  "use strict";

  var GRID = "#e3e8f2";
  // A caixa tem a mesma largura do teto de .rg-svg no CSS: assim o desenho
  // nunca é esticado para além de 1:1 e o texto sai no tamanho real.
  var CW = 1160, CH = 400, M = { t: 26, r: 20, b: 52, l: 78 };
  var PW = CW - M.l - M.r, PH = CH - M.t - M.b;

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  function abrevia(v) {
    var n = Math.abs(num(v));
    if (n >= 1000000) return (num(v) / 1000000).toFixed(n >= 10000000 ? 0 : 1).replace(".", ",") + "M";
    if (n >= 1000) return (num(v) / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",") + "k";
    return String(Math.round(num(v)));
  }
  var FMT = {
    int: function (v) { return Math.round(num(v)).toLocaleString("pt-BR"); },
    curto: abrevia,
    moeda: function (v) { return "R$ " + abrevia(v); },
    pct: function (v) { return Math.round(num(v)) + "%"; }
  };

  // Escala "bonita": entre os passos redondos possíveis, fica com o menor topo
  // que ainda dê de 3 a 6 faixas. A versão anterior olhava só max/4 e por isso
  // sobrava espaço vazio (1097 virava topo 1500 — 27% do gráfico em branco).
  function escala(max) {
    if (max <= 0) return { topo: 1, passo: 0.25 };
    var exp = Math.pow(10, Math.floor(Math.log(max) / Math.LN10) - 1);
    var melhor = null;
    [1, 2, 2.5, 5, 10, 20, 25, 50, 100].forEach(function (m) {
      var passo = m * exp, faixas = Math.ceil(max / passo);
      if (faixas < 3 || faixas > 6) return;
      var topo = faixas * passo;
      if (!melhor || topo < melhor.topo) melhor = { topo: topo, passo: passo };
    });
    return melhor || { topo: max, passo: max / 4 };
  }
  function eixoY(topo, passo, fmt) {
    var g = "";
    for (var v = 0; v <= topo + passo / 1000; v += passo) {
      var y = M.t + PH - (v / topo) * PH;
      g += '<line x1="' + M.l + '" y1="' + y + '" x2="' + (M.l + PW) + '" y2="' + y + '" stroke="' + GRID + '" stroke-width="1"' + (v === 0 ? '' : ' stroke-dasharray="4 4"') + '/>' +
           '<text x="' + (M.l - 10) + '" y="' + (y + 4) + '" text-anchor="end" class="rg-tick">' + esc(fmt(v)) + '</text>';
    }
    return g;
  }
  // Inclinar rótulo é feio e come altura: só faz quando o nome não cabe mesmo.
  function precisaGirar(dados) {
    var passo = PW / (dados.length || 1);
    var maior = dados.reduce(function (m, d) {
      return Math.max(m, String(d.rot || d.cidade || d.nome || "").length);
    }, 0);
    return maior * 7.3 > passo - 12;
  }
  function rotuloX(dados, girar) {
    var passo = PW / dados.length;
    return dados.map(function (d, i) {
      var x = M.l + passo * i + passo / 2, t = String(d.rot || d.cidade || d.nome || "");
      if (t.length > 18) t = t.slice(0, 17) + "…";
      return girar
        ? '<text x="' + x + '" y="' + (M.t + PH + 15) + '" text-anchor="end" class="rg-xlbl" transform="rotate(-22 ' + x + ' ' + (M.t + PH + 15) + ')">' + esc(t) + '</text>'
        : '<text x="' + x + '" y="' + (M.t + PH + 20) + '" text-anchor="middle" class="rg-xlbl">' + esc(t) + '</text>';
    }).join("");
  }
  function legenda(series) {
    return '<div class="rg-leg">' + series.map(function (s) {
      return '<span><i style="background:' + s.cor + '"></i>' + esc(s.rot) + '</span>';
    }).join("") + '</div>';
  }

  // Barras agrupadas, com eixo de valores e rótulo em cada barra
  function barras(dados, series, opt) {
    opt = opt || {};
    var fmt = FMT[opt.fmt || "curto"], fmtRot = FMT[opt.fmtRotulo || opt.fmt || "curto"];
    var max = 0;
    dados.forEach(function (d) { series.forEach(function (s) { max = Math.max(max, num(d[s.key])); }); });
    if (opt.max) max = Math.max(max, opt.max);
    var e = escala(max || 1), topo = e.topo;
    var passo = PW / (dados.length || 1);
    var larg = Math.min(54, (passo * 0.74) / series.length);
    var girar = precisaGirar(dados);

    var svg = '<svg class="rg-svg" viewBox="0 0 ' + CW + ' ' + CH + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(opt.titulo || "gráfico de barras") + '">';
    svg += eixoY(topo, e.passo, fmt);
    dados.forEach(function (d, i) {
      var base = M.l + passo * i + passo / 2 - (larg * series.length) / 2;
      series.forEach(function (s, j) {
        var v = num(d[s.key]);
        var h = (v / topo) * PH;
        var x = base + j * larg, y = M.t + PH - h;
        svg += '<rect x="' + x + '" y="' + y + '" width="' + (larg - 5) + '" height="' + Math.max(1, h) + '" rx="4" fill="' + s.cor + '">' +
               '<title>' + esc(d.rot || d.cidade || d.nome) + " · " + esc(s.rot) + ": " + esc(fmtRot(v)) + '</title></rect>';
        // Só rotula quando há espaço; acima disso o valor fica no eixo e na dica
        if (larg >= 30 && dados.length <= 8) {
          svg += '<text x="' + (x + (larg - 5) / 2) + '" y="' + (y - 6) + '" text-anchor="middle" class="rg-vlbl">' + esc(fmtRot(v)) + '</text>';
        }
      });
    });
    svg += rotuloX(dados, girar) + '</svg>';
    return '<div class="rg-chart">' + svg + legenda(series) + '</div>';
  }

  // Linhas (evolução por estado/mês)
  function linhas(dados, series, opt) {
    opt = opt || {};
    var fmt = FMT[opt.fmt || "moeda"];
    var max = 0;
    dados.forEach(function (d) { series.forEach(function (s) { max = Math.max(max, num(d[s.key])); }); });
    var e = escala(max || 1), topo = e.topo;
    // Recuo nas pontas: sem ele o primeiro ponto cola no eixo e o rótulo do
    // último passa da borda do cartão.
    var recuo = 26;
    var util = PW - recuo * 2;
    var passo = dados.length > 1 ? util / (dados.length - 1) : 0;
    var px = function (i) { return dados.length > 1 ? M.l + recuo + passo * i : M.l + PW / 2; };
    var py = function (v) { return M.t + PH - (num(v) / topo) * PH; };

    var svg = '<svg class="rg-svg" viewBox="0 0 ' + CW + ' ' + CH + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(opt.titulo || "evolução") + '">';
    svg += eixoY(topo, e.passo, fmt);
    series.forEach(function (s) {
      var pts = dados.map(function (d, i) { return px(i) + "," + py(d[s.key]); }).join(" ");
      // Área sob a linha só quando há uma série; com várias, os preenchimentos
      // se sobrepõem e a leitura piora.
      if (series.length === 1 && dados.length > 1) {
        var base = M.t + PH;
        var gid = "ga" + Math.random().toString(36).slice(2, 8);
        svg += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
               '<stop offset="0%" stop-color="' + s.cor + '" stop-opacity="0.20"/>' +
               '<stop offset="100%" stop-color="' + s.cor + '" stop-opacity="0"/>' +
               '</linearGradient></defs>';
        svg += '<polygon points="' + px(0) + ',' + base + ' ' + pts + ' ' + px(dados.length - 1) + ',' + base + '" fill="url(#' + gid + ')"/>';
      }
      svg += '<polyline points="' + pts + '" fill="none" stroke="' + s.cor + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
      dados.forEach(function (d, i) {
        svg += '<circle cx="' + px(i) + '" cy="' + py(d[s.key]) + '" r="4" fill="#fff" stroke="' + s.cor + '" stroke-width="2.5">' +
               '<title>' + esc(s.rot) + " · " + esc(d.rot || d.mes) + ": " + esc(fmt(d[s.key])) + '</title></circle>';
      });
    });
    svg += dados.map(function (d, i) {
      return '<text x="' + px(i) + '" y="' + (M.t + PH + 20) + '" text-anchor="middle" class="rg-xlbl">' + esc(d.rot || d.mes) + '</text>';
    }).join("") + '</svg>';
    return '<div class="rg-chart">' + svg + legenda(series) + '</div>';
  }

  // Barras deitadas: bom para categorias com nome longo (plano de contas).
  function barrasH(itens, opt) {
    opt = opt || {};
    var fmt = FMT[opt.fmt || "moeda"];
    var n = itens.length || 1;
    var W = 1160, alt = 32, pad = 12, LW = 230;
    var H = pad * 2 + n * alt;
    var max = itens.reduce(function (m, it) { return Math.max(m, num(it.valor)); }, 0) || 1;
    var maxW = W - LW - 170;

    var svg = '<svg class="rg-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(opt.titulo || "categorias") + '">';
    itens.forEach(function (it, i) {
      var y = pad + i * alt, larg = Math.max(2, (num(it.valor) / max) * maxW);
      var rot = String(it.nome || "");
      if (rot.length > 24) rot = rot.slice(0, 23) + "…";
      svg += '<text x="' + (LW - 12) + '" y="' + (y + alt / 2 + 4) + '" text-anchor="end" class="rg-xlbl">' + esc(rot) + '</text>' +
             '<rect x="' + LW + '" y="' + (y + 4) + '" width="' + larg + '" height="' + (alt - 12) + '" rx="4" fill="' + (it.cor || "#1e3a8c") + '">' +
             '<title>' + esc(it.nome) + ": " + esc(fmt(it.valor)) + '</title></rect>' +
             '<text x="' + (LW + larg + 10) + '" y="' + (y + alt / 2 + 4) + '" class="rg-vlbl" text-anchor="start">' + esc(fmt(it.valor)) + '</text>';
    });
    svg += '</svg>';
    return '<div class="rg-chart">' + svg + '</div>';
  }

  window.TPGraficos = {
    FMT: FMT, escala: escala, eixoY: eixoY, legenda: legenda,
    barras: barras, linhas: linhas, barrasH: barrasH
  };
})();
