// ============================================================
// TODOS PROTEGIDOS — Painel do gerente regional (filiais)
// ------------------------------------------------------------
// Versão nativa (sem React/recharts): gráficos em SVG puro.
// ACESSO: somente administrador. O RLS do Supabase também bloqueia
// no banco, então forçar a URL não expõe dado nenhum.
// Fonte dos números: planilha do Google Drive vinculada pelo admin.
// ============================================================
(function () {
  "use strict";

  var root = document.getElementById("regionalApp");
  if (!root || !window.TPData) return;

  // ---- Cores (paleta da marca) ----
  var NAVY = "#1e3a8c", TURQ = "#14c2ad", GOLD = "#d4a94b",
      GREEN = "#0ba596", RED = "#d64545", GRID = "#e3e8f2", MUTED = "#7c879c";
  var UF_COLOR = { GO: NAVY, SP: "#6b46c1", MT: GREEN, PA: GOLD };

  // ---- Colunas aceitas na planilha (cabeçalho -> campo) ----
  var COLUNAS = [
    { key: "nome", rot: "Filial", alias: ["filial", "nome", "unidade"], txt: true },
    { key: "cidade", rot: "Cidade", alias: ["cidade"], txt: true },
    { key: "uf", rot: "UF", alias: ["uf", "estado"], txt: true },
    { key: "veiculos", rot: "Veículos protegidos", alias: ["veiculos", "veículos", "veiculos protegidos"] },
    { key: "meta_veiculos", rot: "Meta de veículos", alias: ["meta veiculos", "meta de veículos", "meta_veiculos"] },
    { key: "receita", rot: "Receita do mês (R$)", alias: ["receita", "receita do mes", "receita do mês"] },
    { key: "meta_receita", rot: "Meta de receita (R$)", alias: ["meta receita", "meta de receita", "meta_receita"] },
    { key: "crescimento", rot: "Crescimento (%)", alias: ["crescimento", "crescimento %"] },
    { key: "contatos", rot: "Contatos no mês", alias: ["contatos"] },
    { key: "propostas", rot: "Propostas no mês", alias: ["propostas"] },
    { key: "vendas", rot: "Vendas no mês", alias: ["vendas"] },
    { key: "cancelamentos", rot: "Cancelamentos", alias: ["cancelamentos"] },
    { key: "inadimplencia", rot: "Inadimplência (%)", alias: ["inadimplencia", "inadimplência"] },
    { key: "vendedores_ativos", rot: "Vendedores ativos", alias: ["vendedores ativos", "consultores ativos"] },
    { key: "vendedores_meta", rot: "Quadro ideal", alias: ["quadro ideal", "vendedores meta", "meta vendedores"] },
    { key: "entrevistas", rot: "Entrevistas", alias: ["entrevistas"] },
    { key: "contratacoes", rot: "Contratações", alias: ["contratacoes", "contratações"] },
    { key: "retencao", rot: "Retenção (%)", alias: ["retencao", "retenção"] },
    { key: "trilha_pct", rot: "Trilha concluída (%)", alias: ["trilha", "trilha concluida", "trilha concluída"] },
    { key: "certificados_pct", rot: "Certificados (%)", alias: ["certificados", "certificados %"] },
    { key: "premiacoes", rot: "Premiações no mês", alias: ["premiacoes", "premiações"] },
    { key: "meta_individual_pct", rot: "Meta individual média (%)", alias: ["meta individual", "meta individual media"] },
    { key: "destaque_nome", rot: "Consultor destaque", alias: ["destaque", "consultor destaque"], txt: true },
    { key: "destaque_vendas_semana", rot: "Vendas do destaque na semana", alias: ["vendas destaque", "destaque vendas"] },
    { key: "destaque_meta_pct", rot: "Meta do destaque (%)", alias: ["meta destaque", "destaque meta"] }
  ];

  // Planilha vinculada pelo administrador. Fica pré-preenchida no campo
  // enquanto nenhuma outra tiver sido salva.
  var PLANILHA_PADRAO = "https://docs.google.com/spreadsheets/d/1xvJT-eO1rRMMsleKO5VJ854qM9SiVcTR/edit?usp=sharing&rtpof=true&sd=true";

  // ---- Utilidades ----
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function brl(v) { return num(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); }
  function pct(v) { return Math.round(num(v)) + "%"; }
  function pct1(v) { return num(v).toFixed(1).replace(".", ",") + "%"; }
  function safeDiv(a, b) { return num(b) ? num(a) / num(b) : 0; }
  function tone(v, bom, medio) { return v >= bom ? "good" : v >= medio ? "mid" : "bad"; }
  function badge(txt, t) { return '<span class="rg-badge ' + t + '">' + esc(txt) + '</span>'; }

  // ---- Gráficos em SVG ----
  function escudo(valor, size) {
    size = size || 56;
    var v = Math.max(0, Math.min(150, num(valor)));
    var cor = v >= 100 ? GREEN : v >= 80 ? NAVY : v >= 60 ? GOLD : RED;
    var alt = Math.min(100, v);
    var id = "cg" + Math.random().toString(36).slice(2, 8);
    var path = "M50 4 L92 18 V48 C92 76 74 92 50 98 C26 92 8 76 8 48 V18 Z";
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" role="img" aria-label="' + Math.round(v) + '% da meta">' +
      '<defs><clipPath id="' + id + '"><rect x="0" y="' + (100 - alt) + '" width="100" height="' + alt + '"/></clipPath></defs>' +
      '<path d="' + path + '" fill="#eef1ff" stroke="#c7cbea" stroke-width="2"/>' +
      '<path d="' + path + '" fill="' + cor + '" clip-path="url(#' + id + ')"/>' +
      '<text x="50" y="57" text-anchor="middle" font-family="Poppins,sans-serif" font-size="24" font-weight="700" fill="' + (v >= 60 ? "#fff" : "#0e1726") + '">' + Math.round(v) + '</text>' +
      '</svg>';
  }

  // ---- Motor de gráficos ----
  // Caixa fixa em viewBox + preserveAspectRatio: nada é esticado, então
  // texto e cantos arredondados saem sempre nítidos.
  var CW = 820, CH = 330, M = { t: 22, r: 16, b: 54, l: 68 };
  var PW = CW - M.l - M.r, PH = CH - M.t - M.b;

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
  // Escala "bonita": topo arredondado para 1/2/5 x 10^n
  function escala(max) {
    if (max <= 0) return { topo: 1, passo: 0.25 };
    var bruto = max / 4, exp = Math.pow(10, Math.floor(Math.log(bruto) / Math.LN10));
    var n = bruto / exp;
    var passo = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * exp;
    return { topo: Math.ceil(max / passo) * passo, passo: passo };
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
  function rotuloX(dados, girar) {
    var passo = PW / dados.length;
    return dados.map(function (d, i) {
      var x = M.l + passo * i + passo / 2, t = String(d.rot || d.cidade || d.nome || "");
      if (t.length > 16) t = t.slice(0, 15) + "…";
      return girar
        ? '<text x="' + x + '" y="' + (M.t + PH + 16) + '" text-anchor="end" class="rg-xlbl" transform="rotate(-28 ' + x + ' ' + (M.t + PH + 16) + ')">' + esc(t) + '</text>'
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
    var larg = Math.min(46, (passo * 0.68) / series.length);
    var girar = dados.length > 5 || dados.some(function (d) { return String(d.cidade || d.nome || "").length > 12; });

    var svg = '<svg class="rg-svg" viewBox="0 0 ' + CW + ' ' + CH + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(opt.titulo || "gráfico de barras") + '">';
    svg += eixoY(topo, e.passo, fmt);
    dados.forEach(function (d, i) {
      var base = M.l + passo * i + passo / 2 - (larg * series.length) / 2;
      series.forEach(function (s, j) {
        var v = num(d[s.key]);
        var h = (v / topo) * PH;
        var x = base + j * larg, y = M.t + PH - h;
        svg += '<rect x="' + x + '" y="' + y + '" width="' + (larg - 5) + '" height="' + Math.max(1, h) + '" rx="4" fill="' + s.cor + '">' +
               '<title>' + esc(d.cidade || d.nome) + " · " + esc(s.rot) + ": " + esc(fmtRot(v)) + '</title></rect>';
        // Só rotula quando há espaço; acima disso o valor fica no eixo e na dica
        if (larg >= 26 && dados.length <= 5) {
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
    var passo = dados.length > 1 ? PW / (dados.length - 1) : 0;
    var px = function (i) { return dados.length > 1 ? M.l + passo * i : M.l + PW / 2; };
    var py = function (v) { return M.t + PH - (num(v) / topo) * PH; };

    var svg = '<svg class="rg-svg" viewBox="0 0 ' + CW + ' ' + CH + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(opt.titulo || "evolução") + '">';
    svg += eixoY(topo, e.passo, fmt);
    series.forEach(function (s) {
      var pts = dados.map(function (d, i) { return px(i) + "," + py(d[s.key]); }).join(" ");
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

  // Funil em trapézio (contatos -> propostas -> vendas)
  function funil(etapas) {
    var FW = 600, FH = 260, pad = 16;
    var alt = (FH - pad * 2) / etapas.length;
    var max = Math.max.apply(null, etapas.map(function (e) { return num(e.valor); }).concat([1]));
    var eixoX = 190, maxW = 300, minW = 70;          // forma à esquerda, textos à direita
    var w = etapas.map(function (e) { return Math.max(minW, safeDiv(e.valor, max) * maxW); });
    var textoX = eixoX + maxW / 2 + 26;

    var svg = '<svg class="rg-svg rg-svg-funil" viewBox="0 0 ' + FW + ' ' + FH + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="funil comercial">';
    etapas.forEach(function (e, i) {
      var y = pad + alt * i;
      var w1 = w[i], w2 = w[i + 1] !== undefined ? w[i + 1] : w1 * 0.8;
      var x1 = eixoX - w1 / 2, x2 = eixoX - w2 / 2;
      var h = alt - 10;
      svg += '<path d="M' + x1 + ' ' + y + ' H' + (x1 + w1) + ' L' + (x2 + w2) + ' ' + (y + h) + ' H' + x2 + ' Z" fill="' + e.cor + '">' +
             '<title>' + esc(e.nome) + ": " + num(e.valor).toLocaleString("pt-BR") + '</title></path>';
      // valor dentro da forma só quando cabe; senão vai junto do nome
      var cabe = Math.min(w1, w2) >= 86;
      if (cabe) {
        svg += '<text x="' + eixoX + '" y="' + (y + h / 2 + 5) + '" text-anchor="middle" class="rg-flbl">' + num(e.valor).toLocaleString("pt-BR") + '</text>';
      }
      svg += '<text x="' + textoX + '" y="' + (y + h / 2 - 3) + '" class="rg-fname">' + esc(e.nome) +
             (cabe ? "" : " · " + num(e.valor).toLocaleString("pt-BR")) + '</text>';
      if (i > 0) {
        var conv = safeDiv(e.valor, etapas[i - 1].valor) * 100;
        svg += '<text x="' + textoX + '" y="' + (y + h / 2 + 15) + '" class="rg-fconv">' + esc(pct1(conv)) + " do anterior" + '</text>';
      }
    });
    svg += '</svg>';
    return '<div class="rg-chart">' + svg + '</div>';
  }

  // ---- Estado ----
  var filiais = [], historico = [], fonte = null, aba = "geral", filtroUf = "Todas", filialSel = null, ehSuper = false;
  var ordemCol = "receitaPct", ordemDir = "desc";   // ordenação da tabela de filiais

  // Histórico -> séries por UF para o gráfico de evolução
  function serieHistorico() {
    if (!historico.length) return null;
    var meses = [], porMes = {}, ufs = [];
    historico.forEach(function (h) {
      var m = String(h.mes || "").trim(); if (!m) return;
      var uf = String(h.uf || "").toUpperCase().trim() || "TOTAL";
      if (!porMes[m]) { porMes[m] = { rot: m, ordem: num(h.ordem) }; meses.push(m); }
      porMes[m][uf] = num(porMes[m][uf]) + num(h.receita);
      if (ufs.indexOf(uf) < 0) ufs.push(uf);
    });
    var dados = meses.map(function (m) { return porMes[m]; })
                     .sort(function (a, b) { return a.ordem - b.ordem; });
    dados.forEach(function (d) { ufs.forEach(function (u) { if (d[u] === undefined) d[u] = 0; }); });
    var paleta = [NAVY, "#6b46c1", GREEN, GOLD, TURQ, RED];
    var series = ufs.sort().map(function (u, i) {
      return { key: u, rot: u === "TOTAL" ? "Receita total" : u, cor: UF_COLOR[u] || paleta[i % paleta.length] };
    });
    if (filtroUf !== "Todas") {
      var so = series.filter(function (x) { return x.key === filtroUf; });
      if (so.length) series = so;
    }
    return { dados: dados, series: series };
  }

  function enriquecer(f) {
    var e = {};
    for (var k in f) if (f.hasOwnProperty(k)) e[k] = f[k];
    e.receitaPct = safeDiv(f.receita, f.meta_receita) * 100;
    e.veiculosPct = safeDiv(f.veiculos, f.meta_veiculos) * 100;
    e.convContatoVenda = safeDiv(f.vendas, f.contatos) * 100;
    e.convPropostaVenda = safeDiv(f.vendas, f.propostas) * 100;
    e.producaoPorVendedor = safeDiv(f.vendas, f.vendedores_ativos);
    e.ocupacaoPct = safeDiv(f.vendedores_ativos, f.vendedores_meta) * 100;
    e.convContratacao = safeDiv(f.contratacoes, f.entrevistas) * 100;
    return e;
  }
  function visiveis() {
    var l = filiais.map(enriquecer);
    return filtroUf === "Todas" ? l : l.filter(function (f) { return (f.uf || "").toUpperCase() === filtroUf; });
  }
  function somas(src) {
    var t = { unidades: src.length };
    ["receita", "meta_receita", "veiculos", "meta_veiculos", "contatos", "propostas", "vendas",
     "cancelamentos", "vendedores_ativos", "vendedores_meta", "entrevistas", "contratacoes", "premiacoes"]
      .forEach(function (k) { t[k] = src.reduce(function (s, u) { return s + num(u[k]); }, 0); });
    ["crescimento", "inadimplencia", "retencao", "trilha_pct", "certificados_pct", "meta_individual_pct"]
      .forEach(function (k) { t["m_" + k] = src.length ? src.reduce(function (s, u) { return s + num(u[k]); }, 0) / src.length : 0; });
    t.naMeta = src.filter(function (u) { return u.receitaPct >= 100; }).length;
    t.abaixo = src.filter(function (u) { return u.receitaPct < 80; });
    t.trilhaBaixa = src.filter(function (u) { return num(u.trilha_pct) < 60; });
    return t;
  }

  function kpi(rot, val, sub, cor) {
    return '<div class="rg-kpi"><span class="rg-kpi-l">' + esc(rot) + '</span>' +
           '<div class="rg-kpi-v"' + (cor ? ' style="color:' + cor + '"' : "") + '>' + val + '</div>' +
           (sub ? '<div class="rg-kpi-s">' + sub + '</div>' : "") + '</div>';
  }

  // ---- Abas ----
  var ABAS = [
    { k: "geral", r: "Visão geral" },
    { k: "funil", r: "Funil comercial" },
    { k: "equipe", r: "Equipe e recrutamento" },
    { k: "treinamento", r: "Treinamento (TP University)" },
    { k: "ranking", r: "Ranking de filiais" },
    { k: "filial", r: "Painel por filial" },
    { k: "fontes", r: "Planilhas e dados" }
  ];

  function render() {
    var src = visiveis(), t = somas(src);
    var ufs = [];
    filiais.forEach(function (f) { var u = (f.uf || "").toUpperCase(); if (u && ufs.indexOf(u) < 0) ufs.push(u); });
    ufs.sort();

    var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
                 "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    var agora = new Date();
    var competencia = MESES[agora.getMonth()] + " de " + agora.getFullYear();

    var h = '<div class="rg-head">' +
      '<div><h2>Painel do gerente regional</h2>' +
        '<p>' + filiais.length + (filiais.length === 1 ? " filial" : " filiais") +
          (ufs.length ? " · " + ufs.join(" · ") : "") + ' — ' + competencia + '</p></div>' +
      '<div class="rg-ufs">' + ["Todas"].concat(ufs).map(function (u) {
        return '<button type="button" class="rg-uf' + (filtroUf === u ? " on" : "") + '" data-uf="' + u + '">' + (u === "Todas" ? "Todas as filiais" : u) + '</button>';
      }).join("") + '</div></div>';

    h += '<div class="rg-tabs">' + ABAS.map(function (a) {
      return '<button type="button" class="rg-tab' + (aba === a.k ? " on" : "") + '" data-aba="' + a.k + '">' + a.r + '</button>';
    }).join("") + '</div>';

    if (!filiais.length && aba !== "fontes") {
      h += '<div class="gestao-empty" style="padding:44px">Nenhuma filial cadastrada ainda. Vá em <strong>Planilhas e dados</strong> para vincular a planilha do Google Drive ou lançar os números manualmente.</div>';
      root.innerHTML = h; ligar(); return;
    }

    if (aba !== "filial" && aba !== "fontes" && t.abaixo.length) {
      h += '<div class="rg-alerta"><strong>' + t.abaixo.length + ' filial(is)</strong> abaixo de 80% da meta de receita — plano de ação necessário: ' +
           esc(t.abaixo.map(function (u) { return u.cidade || u.nome; }).join(", ")) + '.</div>';
    }

    if (aba === "geral") {
      h += '<div class="rg-kpis">' +
        kpi("Receita do mês", brl(t.receita), pct(safeDiv(t.receita, t.meta_receita) * 100) + " da meta de " + brl(t.meta_receita), t.receita >= t.meta_receita ? GREEN : NAVY) +
        kpi("Veículos protegidos", num(t.veiculos).toLocaleString("pt-BR"), "meta: " + num(t.meta_veiculos).toLocaleString("pt-BR")) +
        kpi("Crescimento médio", (t.m_crescimento >= 0 ? "+" : "") + t.m_crescimento.toFixed(1).replace(".", ",") + "%", "vs. mês anterior", t.m_crescimento >= 0 ? GREEN : RED) +
        kpi("Filiais na meta", t.naMeta + " / " + t.unidades, "acima de 100% da receita") +
        '</div>';
      // Evolução mensal da receita (2ª planilha)
      var ev = serieHistorico();
      h += '<div class="rg-card"><h3>Evolução da receita por estado</h3>';
      h += ev
        ? linhas(ev.dados, ev.series, { fmt: "moeda", titulo: "Evolução da receita" })
        : '<div class="gestao-empty" style="padding:26px">Vincule a <strong>planilha de histórico</strong> em “Planilhas e dados” para ver a evolução mês a mês (colunas: <code>Mês</code>, <code>UF</code>, <code>Receita</code>).</div>';
      h += '</div>';
    }

    if (aba === "funil") {
      h += '<div class="rg-kpis">' +
        kpi("Contatos", num(t.contatos).toLocaleString("pt-BR")) +
        kpi("Propostas", num(t.propostas).toLocaleString("pt-BR"), pct1(safeDiv(t.propostas, t.contatos) * 100) + " dos contatos") +
        kpi("Vendas", num(t.vendas).toLocaleString("pt-BR"), "conversão de " + pct1(safeDiv(t.vendas, t.contatos) * 100)) +
        kpi("Cancelamentos", t.cancelamentos, "inadimplência média " + pct1(t.m_inadimplencia), RED) +
        '</div>';
      h += '<div class="rg-2col">' +
        '<div class="rg-card"><h3>Funil comercial da regional</h3>' +
          funil([{ nome: "Contatos", valor: t.contatos, cor: "#c7cbea" },
                 { nome: "Propostas", valor: t.propostas, cor: "#8b7fe0" },
                 { nome: "Vendas", valor: t.vendas, cor: NAVY }]) + '</div>' +
        '<div class="rg-card"><h3>Conversão por filial</h3><div class="rg-conv">' +
          src.slice().sort(function (a, b) { return b.convContatoVenda - a.convContatoVenda; }).map(function (u) {
            return '<div class="rg-conv-l"><span>' + esc(u.cidade || u.nome) + '</span>' +
                   '<div class="rg-conv-bar"><i style="width:' + Math.min(100, u.convContatoVenda * 5) + '%"></i></div>' +
                   '<b>' + pct1(u.convContatoVenda) + '</b></div>';
          }).join("") + '</div></div></div>';
      h += tabela("Cancelamentos e inadimplência por filial", ["Filial", "Vendas", "Cancelamentos", "Inadimplência"], src.map(function (u) {
        return ["<b>" + esc(u.nome) + "</b>", num(u.vendas), '<span style="color:' + (num(u.cancelamentos) > 3 ? RED : "inherit") + '">' + num(u.cancelamentos) + "</span>",
                badge(pct1(u.inadimplencia), num(u.inadimplencia) < 3 ? "good" : num(u.inadimplencia) < 5 ? "mid" : "bad")];
      }));
    }

    if (aba === "equipe") {
      h += '<div class="rg-kpis">' +
        kpi("Vendedores ativos", t.vendedores_ativos + " / " + t.vendedores_meta, pct1(safeDiv(t.vendedores_ativos, t.vendedores_meta) * 100) + " do quadro ideal") +
        kpi("Entrevistas no mês", t.entrevistas) +
        kpi("Contratações", t.contratacoes, "conversão de " + pct1(safeDiv(t.contratacoes, t.entrevistas) * 100), GREEN) +
        kpi("Retenção média", pct1(t.m_retencao), "", t.m_retencao >= 80 ? GREEN : RED) +
        '</div>';
      h += '<div class="rg-card"><h3>Produção por vendedor e ocupação do quadro</h3>' +
        barras(src, [{ key: "vendedores_ativos", rot: "Ativos", cor: NAVY }, { key: "vendedores_meta", rot: "Quadro ideal", cor: "#c7cbea" }], { fmt: "int", titulo: "Vendedores por filial" }) + '</div>';
      h += tabela("Recrutamento e retenção por filial", ["Filial", "Vendedores", "Produção/vendedor", "Entrevistas", "Contratações", "Retenção"], src.map(function (u) {
        return ["<b>" + esc(u.nome) + "</b>", num(u.vendedores_ativos) + "/" + num(u.vendedores_meta),
                u.producaoPorVendedor.toFixed(1).replace(".", ","), num(u.entrevistas), num(u.contratacoes),
                badge(pct1(u.retencao), tone(num(u.retencao), 85, 70))];
      }));
    }

    if (aba === "treinamento") {
      h += '<div class="rg-kpis">' +
        kpi("Trilha concluída (média)", pct1(t.m_trilha_pct), 'trilha "Do novato ao Pro"', t.m_trilha_pct >= 70 ? GREEN : t.m_trilha_pct >= 50 ? GOLD : RED) +
        kpi("Consultores certificados", pct1(t.m_certificados_pct), "protocolos: cotação, cadastro, vistoria, contrato") +
        kpi("Meta individual (média)", pct1(t.m_meta_individual_pct), "meta de 15 vendas/consultor", t.m_meta_individual_pct >= 100 ? GREEN : NAVY) +
        kpi("Premiações semanais pagas", t.premiacoes, "no mês, na regional") +
        '</div>';
      if (t.trilhaBaixa.length) {
        h += '<div class="rg-alerta"><strong>' + t.trilhaBaixa.length + ' filial(is)</strong> com menos de 60% da trilha concluída: ' +
             esc(t.trilhaBaixa.map(function (u) { return u.cidade || u.nome; }).join(", ")) + '. Priorize o treinamento diário nessas unidades.</div>';
      }
      h += '<div class="rg-card"><h3>Progresso da trilha por filial</h3>' +
        barras(src, [{ key: "trilha_pct", rot: "Trilha concluída", cor: TURQ }, { key: "certificados_pct", rot: "Certificados", cor: "#c7cbea" }], { max: 100, fmt: "pct", titulo: "Progresso da trilha por filial" }) + '</div>';
      h += tabela("Destaque da semana por filial (TP University)", ["Filial", "Consultor destaque", "Vendas na semana", "Meta mensal (15)", "Premiações"], src.map(function (u) {
        return ["<b>" + esc(u.nome) + "</b>", "🏆 " + esc(u.destaque_nome || "—"), num(u.destaque_vendas_semana),
                badge(pct(u.destaque_meta_pct), tone(num(u.destaque_meta_pct), 100, 70)), num(u.premiacoes)];
      }), "Fonte: TP University — trilha, protocolos, ranking semanal e premiações.");
    }

    if (aba === "ranking") {
      h += '<div class="rg-card"><h3>Ranking de filiais — meta de receita</h3><div class="rg-escudos">' +
        src.slice().sort(function (a, b) { return b.receitaPct - a.receitaPct; }).map(function (u, i) {
          return '<div class="rg-escudo">' + (i === 0 ? '<span class="rg-coroa">🏆</span>' : "") + escudo(u.receitaPct) +
                 '<span class="rg-escudo-n">' + esc(u.cidade || u.nome) + '</span><span class="rg-escudo-uf">' + esc(u.uf) + '</span></div>';
        }).join("") + '</div></div>';
      var COLS_ORD = [
        { rot: "Filial", key: "nome", txt: true }, { rot: "UF", key: "uf", txt: true },
        { rot: "Veículos", key: "veiculos" }, { rot: "% meta veículos", key: "veiculosPct" },
        { rot: "Receita", key: "receita" }, { rot: "% meta receita", key: "receitaPct" },
        { rot: "Crescimento", key: "crescimento" }
      ];
      var ordenado = src.slice().sort(function (a, b) {
        var col = COLS_ORD.filter(function (c) { return c.key === ordemCol; })[0] || COLS_ORD[5];
        var va = a[col.key], vb = b[col.key];
        var cmp = col.txt ? String(va || "").localeCompare(String(vb || ""), "pt-BR") : (num(va) - num(vb));
        return ordemDir === "desc" ? -cmp : cmp;
      });
      h += '<div class="rg-card"><h3>Veículos protegidos vs. meta por filial</h3>' +
        barras(src, [{ key: "veiculos", rot: "Veículos protegidos", cor: NAVY }, { key: "meta_veiculos", rot: "Meta", cor: "#c7cbea" }],
               { fmt: "int", titulo: "Veículos protegidos vs. meta" }) + '</div>';
      h += tabelaOrd("Detalhamento por filial", COLS_ORD,
        ordenado.map(function (u) {
          return ["<b>" + esc(u.nome) + "</b>", esc(u.uf), num(u.veiculos).toLocaleString("pt-BR"),
                  badge(pct(u.veiculosPct), tone(u.veiculosPct, 100, 80)), brl(u.receita),
                  badge(pct(u.receitaPct), tone(u.receitaPct, 100, 80)),
                  '<span style="color:' + (num(u.crescimento) >= 0 ? GREEN : RED) + '">' + (num(u.crescimento) >= 0 ? "+" : "") + num(u.crescimento).toFixed(1).replace(".", ",") + "%</span>"];
        }));
    }

    if (aba === "filial") {
      var u = src.filter(function (x) { return x.id === filialSel; })[0] || src[0];
      if (!u) { h += '<div class="gestao-empty" style="padding:40px">Nenhuma filial neste filtro.</div>'; }
      else {
        filialSel = u.id;
        h += '<div class="rg-chips">' + src.map(function (x) {
          return '<button type="button" class="rg-chip' + (x.id === u.id ? " on" : "") + '" data-filial="' + esc(x.id) + '">' + esc(x.nome) + '</button>';
        }).join("") + '</div>';
        h += '<div class="rg-filial"><div class="rg-card rg-gauge">' + escudo(u.receitaPct, 80) +
             '<strong>' + esc(u.nome) + '</strong><span>' + esc(u.uf) + ' · meta de receita</span></div>' +
             '<div class="rg-kpis rg-kpis-3">' +
               kpi("Receita do mês", brl(u.receita), "meta " + brl(u.meta_receita), u.receitaPct >= 100 ? GREEN : NAVY) +
               kpi("Veículos protegidos", num(u.veiculos).toLocaleString("pt-BR"), "meta " + num(u.meta_veiculos).toLocaleString("pt-BR")) +
               kpi("Crescimento", (num(u.crescimento) >= 0 ? "+" : "") + num(u.crescimento).toFixed(1).replace(".", ",") + "%", "", num(u.crescimento) >= 0 ? GREEN : RED) +
               kpi("Vendedores ativos", num(u.vendedores_ativos) + " / " + num(u.vendedores_meta), pct1(u.ocupacaoPct) + " do quadro") +
               kpi("Conversão contato-venda", pct1(u.convContatoVenda), num(u.vendas) + " vendas / " + num(u.contatos) + " contatos") +
               kpi("Inadimplência", pct1(u.inadimplencia), num(u.cancelamentos) + " cancelamentos", num(u.inadimplencia) < 4 ? GREEN : RED) +
               kpi("Trilha TP University", pct1(u.trilha_pct), pct1(u.certificados_pct) + " certificados", num(u.trilha_pct) >= 70 ? GREEN : num(u.trilha_pct) >= 50 ? GOLD : RED) +
               kpi("Consultor destaque", esc(u.destaque_nome || "—"), num(u.destaque_vendas_semana) + " vendas na semana · " + pct(u.destaque_meta_pct) + " da meta") +
             '</div></div>';
        h += '<div class="rg-2col"><div class="rg-card"><h3>Funil — ' + esc(u.nome) + '</h3>' +
          funil([{ nome: "Contatos", valor: u.contatos, cor: "#c7cbea" }, { nome: "Propostas", valor: u.propostas, cor: "#8b7fe0" }, { nome: "Vendas", valor: u.vendas, cor: NAVY }]) + '</div>';
        h += '<div class="rg-card"><h3>Recrutamento e equipe</h3><table class="table"><tbody>' +
          '<tr><td>Entrevistas no mês</td><td class="rg-r">' + num(u.entrevistas) + '</td></tr>' +
          '<tr><td>Contratações</td><td class="rg-r">' + num(u.contratacoes) + '</td></tr>' +
          '<tr><td>Conversão entrevista-contratação</td><td class="rg-r">' + pct1(u.convContratacao) + '</td></tr>' +
          '<tr><td>Produção por vendedor</td><td class="rg-r">' + u.producaoPorVendedor.toFixed(1).replace(".", ",") + ' vendas</td></tr>' +
          '<tr><td>Retenção da equipe</td><td class="rg-r">' + badge(pct1(u.retencao), tone(num(u.retencao), 85, 70)) + '</td></tr>' +
          '</tbody></table></div></div>';
        if (u.receitaPct < 80) {
          h += '<div class="rg-alerta">' + esc(u.nome) + ' está abaixo de 80% da meta de receita — recomenda-se plano de ação formal com metas diárias de recuperação.</div>';
        }
      }
    }

    if (aba === "fontes") h += abaFontes();

    root.innerHTML = h;
    if (msgPendente && document.getElementById("rgMsg")) msg(msgPendente.txt, msgPendente.ok);
    ligar();
  }

  // Tabela com cabeçalho clicável para ordenar
  function tabelaOrd(titulo, cols, linhas) {
    return '<div class="rg-card"><h3>' + esc(titulo) + '</h3><div class="table-wrap"><table class="table rg-tbl-ord"><thead><tr>' +
      cols.map(function (c) {
        var ativo = c.key === ordemCol;
        return '<th data-ord="' + c.key + '" class="' + (ativo ? "on" : "") + '">' + esc(c.rot) +
               '<span class="rg-seta">' + (ativo ? (ordemDir === "desc" ? "▾" : "▴") : "⇅") + '</span></th>';
      }).join("") + '</tr></thead><tbody>' +
      linhas.map(function (l) { return "<tr>" + l.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") +
      '</tbody></table></div></div>';
  }

  function tabela(titulo, cols, linhas, rodape) {
    return '<div class="rg-card"><h3>' + esc(titulo) + '</h3><div class="table-wrap"><table class="table"><thead><tr>' +
      cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + '</tr></thead><tbody>' +
      linhas.map(function (l) { return "<tr>" + l.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") +
      '</tbody></table></div>' + (rodape ? '<p class="rg-fonte">' + esc(rodape) + '</p>' : "") + '</div>';
  }

  // ---- Aba "Planilhas e dados" (só admin chega aqui) ----
  function abaFontes() {
    var urlAtual = (fonte && fonte.url) || PLANILHA_PADRAO;
    var info = analisarLink(urlAtual);

    var h = '<div class="rg-card"><h3>Planilha do Google Drive</h3>' +
      '<p class="rg-p">Cole o link da planilha — serve o link de edição, o de compartilhamento ou o CSV publicado. ' +
      'Para o painel conseguir ler sozinho, a planilha precisa estar em <strong>Arquivo → Compartilhar → Publicar na web</strong>, aba escolhida, formato <strong>CSV</strong>.</p>' +
      '<div class="rg-form">' +
        '<label>Link da planilha<input type="url" id="rgUrl" placeholder="https://docs.google.com/spreadsheets/d/.../edit" value="' + esc(urlAtual) + '"></label>' +
        '<div class="rg-form-acts">' +
          '<button type="button" class="btn btn-primary btn-sm" id="rgSalvarUrl">Salvar e importar</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="rgSincronizar">Sincronizar agora</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="rgModelo">Baixar modelo CSV</button>' +
          (info.id || info.pubId
            ? '<a class="btn btn-ghost btn-sm" href="' + esc(urlAtual) + '" target="_blank" rel="noopener">Abrir planilha</a>'
            : "") +
        '</div>' +
      '</div>';
    if (info.xlsx) {
      h += '<div class="rg-alerta" style="margin-top:12px">Essa planilha está no Drive como arquivo <strong>Excel (.xlsx)</strong>. ' +
           'Abra-a e use <strong>Arquivo → Salvar como Planilhas Google</strong>; depois publique a cópia em CSV e cole aqui o novo link. ' +
           'Até lá, importe pela colagem logo abaixo — funciona igual.</div>';
    }
    h += '<div class="rg-form" style="margin-top:18px;padding-top:16px;border-top:1px solid var(--tp-line)">' +
        '<label>Planilha de histórico (opcional) — colunas <code>Mês</code>, <code>UF</code>, <code>Receita</code>' +
          '<input type="url" id="rgUrlHist" placeholder="Link da aba de histórico (publicada em CSV)" value="' + esc(fonte && fonte.url_historico ? fonte.url_historico : "") + '"></label>' +
        '<div class="rg-form-acts">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="rgSyncHist">Importar histórico</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="rgModeloHist">Baixar modelo do histórico</button>' +
          '<span class="rg-sync" style="margin:0;align-self:center">' + (historico.length ? historico.length + ' linha(s) importada(s)' : 'alimenta o gráfico de evolução') + '</span>' +
        '</div></div>';
    if (fonte && fonte.ultima_sync) {
      h += '<p class="rg-sync">Última importação: ' + esc(new Date(fonte.ultima_sync).toLocaleString("pt-BR")) + ' · ' + num(fonte.linhas) + ' filial(is).</p>';
    }
    h += '<div id="rgMsg" class="rg-msg"></div></div>';

    h += '<div class="rg-card"><h3>Importar por colagem (alternativa)</h3>' +
      '<p class="rg-p">Se o navegador bloquear o link (CORS), copie a planilha inteira e cole aqui — funciona com <strong>Ctrl+C / Ctrl+V</strong> direto do Google Sheets, ou envie o arquivo CSV.</p>' +
      '<textarea id="rgColar" class="rg-textarea" placeholder="Cole aqui as células copiadas da planilha (com a linha de cabeçalho)…"></textarea>' +
      '<div class="rg-form-acts">' +
        '<button type="button" class="btn btn-primary btn-sm" id="rgImportarTexto">Importar dados colados</button>' +
        '<label class="btn btn-ghost btn-sm" style="cursor:pointer">Enviar arquivo CSV<input type="file" id="rgArquivo" accept=".csv,text/csv" hidden></label>' +
      '</div></div>';

    h += '<div class="rg-card"><h3>Colunas aceitas</h3><p class="rg-p">A primeira linha deve conter os títulos. A ordem não importa e colunas extras são ignoradas.</p>' +
      '<div class="rg-cols">' + COLUNAS.map(function (c) { return '<code>' + esc(c.rot) + '</code>'; }).join("") + '</div></div>';

    // Lançamento manual
    h += '<div class="rg-card"><h3>Filiais cadastradas (' + filiais.length + ')</h3>';
    if (!filiais.length) h += '<div class="gestao-empty" style="padding:22px">Nenhuma filial ainda.</div>';
    else {
      h += '<div class="table-wrap"><table class="table"><thead><tr><th>Filial</th><th>UF</th><th>Receita</th><th>Vendas</th><th>Atualizado</th><th></th></tr></thead><tbody>' +
        filiais.map(function (f) {
          return '<tr><td><b>' + esc(f.nome) + '</b></td><td>' + esc(f.uf || "—") + '</td><td>' + brl(f.receita) + '</td><td>' + num(f.vendas) + '</td>' +
                 '<td>' + (f.atualizado_em ? esc(new Date(f.atualizado_em).toLocaleDateString("pt-BR")) : "—") + '</td>' +
                 '<td class="rg-r"><button type="button" class="icon-btn-sm" data-del="' + esc(f.id) + '" aria-label="Excluir">✕</button></td></tr>';
        }).join("") + '</tbody></table></div>';
    }
    h += '</div>';
    return h;
  }

  // ---- Link do Google Drive ----
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

  // Tenta os endereços na ordem e devolve o primeiro que responder CSV de verdade.
  function buscarCSV(lista) {
    var i = 0, ultimo = null;
    function tentar() {
      if (i >= lista.length) return Promise.reject(ultimo || new Error("sem resposta"));
      var alvo = lista[i++];
      return fetch(alvo, { credentials: "omit" })
        .then(function (resp) {
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          return resp.text();
        })
        .then(function (t) {
          // Sem permissão o Google devolve a tela de login em HTML, não o CSV.
          if (/^\s*</.test(t)) throw new Error("html");
          return { texto: t, url: alvo };
        })
        .catch(function (e) { ultimo = e; return tentar(); });
    }
    return tentar();
  }

  // Explica em português por que a leitura falhou, com o passo a passo da correção.
  function explicarFalha(info) {
    if (info && info.xlsx) {
      return 'Esse link é de um arquivo Excel (.xlsx) enviado ao Drive, não de uma Planilha Google — por isso não dá para ler os dados direto. ' +
             'Abra o arquivo e use "Arquivo → Salvar como Planilhas Google"; depois, na cópia criada, "Arquivo → Compartilhar → Publicar na web", ' +
             'escolha a aba, formato CSV, e cole aqui o link gerado. Enquanto isso, dá para colar os dados na caixa de importação abaixo.';
    }
    return 'Não consegui ler a planilha por esse link. Três causas prováveis: (1) ela não está publicada em CSV — faça "Arquivo → Compartilhar → Publicar na web", ' +
           'escolha a aba e o formato CSV; (2) o compartilhamento não está como "qualquer pessoa com o link"; ' +
           '(3) o arquivo está no Drive como Excel (.xlsx) e não como Planilha Google — nesse caso, abra e use "Arquivo → Salvar como Planilhas Google" antes. ' +
           'Para resolver agora sem mexer em nada disso, use a importação por colagem logo abaixo.';
  }

  // ---- CSV / colagem ----
  function parseCSV(texto) {
    var sep = texto.indexOf("\t") >= 0 && texto.indexOf("\t") < (texto.indexOf("\n") < 0 ? texto.length : texto.indexOf("\n")) ? "\t" : ",";
    var linhas = [], campo = "", linha = [], aspas = false;
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i];
      if (aspas) {
        if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else aspas = false; }
        else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === sep) { linha.push(campo); campo = ""; }
      else if (c === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; }
      else if (c !== "\r") campo += c;
    }
    if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }
    return linhas.filter(function (l) { return l.some(function (c) { return String(c).trim() !== ""; }); });
  }
  // Compara cabeçalhos ignorando acento, caixa, espaços e sinais como (%) e R$
  function normalizar(s) {
    return String(s || "").trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/r\$/g, "").replace(/[()%]/g, "")
      .replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  }
  // Lê número no formato brasileiro: "R$ 213.000" = 213000 e "2,6" = 2.6.
  // O ponto só é decimal quando NÃO está separando milhares (ex.: "2.6").
  function numeroBR(v) {
    var s = String(v == null ? "" : v).replace(/[R$\s%]/gi, "").trim();
    if (!s) return 0;
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }
  function csvParaFiliais(texto) {
    var linhas = parseCSV(texto);
    if (linhas.length < 2) return { erro: "A planilha precisa ter a linha de títulos e ao menos uma filial." };
    var cab = linhas[0].map(normalizar);
    var mapa = {};
    COLUNAS.forEach(function (c) {
      for (var i = 0; i < cab.length; i++) {
        var h = cab[i];
        if (h === normalizar(c.rot) || c.alias.some(function (a) { return normalizar(a) === h; })) { mapa[c.key] = i; break; }
      }
    });
    if (mapa.nome === undefined) return { erro: 'Não encontrei a coluna "Filial" (ou "Nome") na primeira linha da planilha.' };
    var out = [], ignoradas = 0;
    for (var l = 1; l < linhas.length; l++) {
      var row = linhas[l];
      var nome = String(row[mapa.nome] || "").trim();
      if (!nome) { ignoradas++; continue; }
      var f = { nome: nome, ordem: out.length };
      COLUNAS.forEach(function (c) {
        if (c.key === "nome" || mapa[c.key] === undefined) return;
        var bruto = row[mapa[c.key]];
        f[c.key] = c.txt ? String(bruto == null ? "" : bruto).trim() : numeroBR(bruto);
      });
      COLUNAS.forEach(function (c) { if (f[c.key] === undefined) f[c.key] = c.txt ? "" : 0; });
      if (f.uf) f.uf = f.uf.toUpperCase().slice(0, 2);
      out.push(f);
    }
    if (!out.length) return { erro: "Nenhuma filial encontrada nas linhas da planilha." };
    return { filiais: out, ignoradas: ignoradas };
  }

  var msgPendente = null;   // mantida ao redesenhar a aba após importar
  // Histórico: Mês | UF | Receita
  function csvParaHistorico(texto) {
    var linhas = parseCSV(texto);
    if (linhas.length < 2) return { erro: "A planilha de histórico precisa do cabeçalho e de ao menos uma linha." };
    var cab = linhas[0].map(normalizar);
    var iMes = -1, iUf = -1, iRec = -1;
    cab.forEach(function (c, i) {
      if (iMes < 0 && (c === "mes" || c === "mês" || c === "periodo" || c === "período" || c === "competencia")) iMes = i;
      if (iUf < 0 && (c === "uf" || c === "estado")) iUf = i;
      if (iRec < 0 && (c === "receita" || c === "valor" || c === "faturamento")) iRec = i;
    });
    if (iMes < 0 || iRec < 0) return { erro: 'A planilha de histórico precisa das colunas "Mês" e "Receita" (a coluna "UF" é opcional).' };
    var out = [];
    for (var l = 1; l < linhas.length; l++) {
      var mes = String(linhas[l][iMes] || "").trim();
      if (!mes) continue;
      out.push({
        mes: mes, ordem: out.length,
        uf: iUf >= 0 ? String(linhas[l][iUf] || "").trim().toUpperCase().slice(0, 2) : "",
        receita: numeroBR(linhas[l][iRec])
      });
    }
    if (!out.length) return { erro: "Nenhuma linha de histórico encontrada." };
    // A ordem dos meses segue a ordem da planilha (primeira ocorrência)
    var vistos = {}, seq = 0;
    out.forEach(function (x) { if (vistos[x.mes] === undefined) vistos[x.mes] = seq++; x.ordem = vistos[x.mes]; });
    return { historico: out };
  }

  function importarHistorico(texto, url) {
    var r = csvParaHistorico(texto);
    if (r.erro) { msg(r.erro, false); return; }
    TPData.saveHistorico(r.historico).then(function (res) {
      if (res && res.ok === false) { msg(res.error || "Não foi possível salvar o histórico.", false); return; }
      if (url !== undefined) {
        var d = {
          nome: "Planilha de filiais", url: (fonte && fonte.url) || "",
          url_historico: url, ultima_sync: (fonte && fonte.ultima_sync) || null, linhas: (fonte && fonte.linhas) || 0
        };
        TPData.setFonteFiliais(d).then(function () { fonte = d; });
      }
      msg(r.historico.length + " linha(s) de histórico importada(s). O gráfico de evolução já está na Visão geral.", true);
      carregar(true);
    }, function () { msg("Erro ao salvar o histórico.", false); });
  }

  function msg(txt, ok) {
    msgPendente = txt ? { txt: txt, ok: ok } : null;
    var el = document.getElementById("rgMsg");
    if (!el) return;
    el.textContent = txt || "";
    el.className = "rg-msg" + (txt ? " show " + (ok ? "ok" : "err") : "");
  }

  function importarTexto(texto, origem) {
    var r = csvParaFiliais(texto);
    if (r.erro) { msg(r.erro, false); return; }
    TPData.saveFiliais(r.filiais).then(function (res) {
      if (res && res.ok === false) { msg(res.error || "Não foi possível salvar as filiais.", false); return; }
      var d = { nome: "Planilha de filiais", url: (fonte && fonte.url) || origem || "", ultima_sync: new Date().toISOString(), linhas: r.filiais.length };
      TPData.setFonteFiliais(d).then(function () { fonte = d; carregar(true); });
      msg(r.filiais.length + " filial(is) importada(s) com sucesso." + (r.ignoradas ? " " + r.ignoradas + " linha(s) sem nome foram ignoradas." : ""), true);
    }, function () { msg("Erro ao salvar as filiais.", false); });
  }

  // qual: "filiais" (padrão) ou "hist"
  function sincronizarUrl(url, qual) {
    var info = analisarLink(url);
    if (info.vazio) { msg("Cole o link da planilha do Google Drive.", false); return; }
    msg(qual === "hist" ? "Importando o histórico…" : "Importando da planilha…", true);
    buscarCSV(info.csv).then(function (r) {
      if (qual === "hist") importarHistorico(r.texto, url);
      else importarTexto(r.texto, url);
    }, function () { msg(explicarFalha(info), false); });
  }

  function baixarCSV(nomeArquivo, conteudo) {
    var blob = new Blob(["\ufeff" + conteudo], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nomeArquivo;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function modeloCSV() {
    var cab = COLUNAS.map(function (c) { return c.rot; }).join(",");
    var ex = COLUNAS.map(function (c) {
      if (c.key === "nome" || c.key === "cidade") return "Goiânia";
      if (c.key === "uf") return "GO";
      if (c.key === "destaque_nome") return "Marcos Silva";
      return "0";
    }).join(",");
    baixarCSV("modelo-filiais-todos-protegidos.csv", cab + "\n" + ex + "\n");
  }

  // ---- Eventos ----
  function ligar() {
    Array.prototype.forEach.call(root.querySelectorAll("[data-aba]"), function (b) {
      b.addEventListener("click", function () { aba = b.getAttribute("data-aba"); render(); });
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-uf]"), function (b) {
      b.addEventListener("click", function () { filtroUf = b.getAttribute("data-uf"); render(); });
    });
    Array.prototype.forEach.call(root.querySelectorAll("th[data-ord]"), function (th) {
      th.addEventListener("click", function () {
        var k = th.getAttribute("data-ord");
        if (ordemCol === k) ordemDir = ordemDir === "desc" ? "asc" : "desc";
        else { ordemCol = k; ordemDir = "desc"; }
        render();
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-filial]"), function (b) {
      b.addEventListener("click", function () { filialSel = b.getAttribute("data-filial"); render(); });
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-del]"), function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-del");
        var f = filiais.filter(function (x) { return x.id === id; })[0];
        if (!window.confirm('Excluir a filial "' + (f ? f.nome : "") + '"? Os números dela saem do painel.')) return;
        TPData.deleteFilial(id).then(function () { carregar(true); });
      });
    });

    var bUrl = document.getElementById("rgSalvarUrl");
    if (bUrl) bUrl.addEventListener("click", function () {
      var url = (document.getElementById("rgUrl").value || "").trim();
      if (!url) { msg("Cole o link da planilha do Google Drive.", false); return; }
      TPData.setFonteFiliais({ nome: "Planilha de filiais", url: url }).then(function () {
        fonte = fonte || {}; fonte.url = url;
        sincronizarUrl(url);
      });
    });
    var bSync = document.getElementById("rgSincronizar");
    if (bSync) bSync.addEventListener("click", function () {
      sincronizarUrl((document.getElementById("rgUrl").value || "").trim());
    });
    var bMod = document.getElementById("rgModelo");
    if (bMod) bMod.addEventListener("click", modeloCSV);
    var bHist = document.getElementById("rgSyncHist");
    if (bHist) bHist.addEventListener("click", function () {
      sincronizarUrl((document.getElementById("rgUrlHist").value || "").trim(), "hist");
    });
    var bModH = document.getElementById("rgModeloHist");
    if (bModH) bModH.addEventListener("click", function () {
      baixarCSV("modelo-historico-todos-protegidos.csv",
        "Mês,UF,Receita\nFev,GO,380000\nFev,SP,130000\nMar,GO,398000\nMar,SP,138000\n");
    });
    var bTxt = document.getElementById("rgImportarTexto");
    if (bTxt) bTxt.addEventListener("click", function () {
      var t = (document.getElementById("rgColar").value || "").trim();
      if (!t) { msg("Cole os dados da planilha na caixa acima.", false); return; }
      // Detecta pelo cabeçalho se é a planilha de filiais ou a de histórico
      var cab0 = (parseCSV(t)[0] || []).map(normalizar);
      var ehHist = cab0.indexOf("receita") >= 0 && (cab0.indexOf("mes") >= 0 || cab0.indexOf("mês") >= 0) && cab0.indexOf("filial") < 0;
      if (ehHist) importarHistorico(t); else importarTexto(t, "");
    });
    var bArq = document.getElementById("rgArquivo");
    if (bArq) bArq.addEventListener("change", function () {
      var f = bArq.files && bArq.files[0]; if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { importarTexto(String(fr.result || ""), f.name); };
      fr.readAsText(f, "utf-8");
    });
  }

  // ---- Carga ----
  function carregar(manterAba) {
    var pHist = TPData.listHistorico ? TPData.listHistorico() : Promise.resolve([]);
    return Promise.all([TPData.listFiliais(), TPData.getFonteFiliais(), pHist]).then(function (r) {
      filiais = (r[0] || []).map(function (f, i) { f.id = f.id || String(i); return f; });
      fonte = r[1] || fonte;
      historico = r[2] || [];
      if (!manterAba && !filiais.length) aba = "fontes";
      render();
    }, function () {
      root.innerHTML = '<div class="gestao-empty" style="padding:40px">Painel indisponível. Rode <code>supabase/regional.sql</code> no Supabase para criar as tabelas.</div>';
    });
  }

  // ---- Porteiro: só administrador ----
  TPData.session().then(function (s) {
    if (!s) { window.location.href = "login.html"; return; }
    if (!(s.role === "admin" || s.role === "superadmin")) {
      // Consultor não tem nada aqui: corrige o papel guardado e devolve à home dele.
      if (window.TPLembrarPapel) TPLembrarPapel(s.role || "consultor");
      root.innerHTML = '<div class="gestao-empty" style="padding:48px">Acesso restrito ao administrador. Redirecionando…</div>';
      setTimeout(function () { window.location.replace("dashboard.html"); }, 900);
      return;
    }
    if (window.TPLembrarPapel) TPLembrarPapel(s.role);
    ehSuper = s.role === "superadmin";
    carregar();
  }, function () { window.location.href = "login.html"; });
})();
