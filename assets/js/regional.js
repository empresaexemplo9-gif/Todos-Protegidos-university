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

  // Barras agrupadas (1 ou 2 séries)
  function barras(dados, series, opt) {
    opt = opt || {};
    var W = 100, H = 42, padL = 3, padB = 9, padT = 3;   // viewBox responsivo
    var max = 0;
    dados.forEach(function (d) { series.forEach(function (s) { max = Math.max(max, num(d[s.key])); }); });
    max = max || 1;
    if (opt.max) max = Math.max(max, opt.max);
    var n = dados.length || 1;
    var slot = (W - padL) / n, bw = Math.min(7, (slot - 1.5) / series.length);
    var svg = '<svg class="rg-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img">';
    [0, 0.5, 1].forEach(function (f) {
      var y = padT + (H - padT - padB) * (1 - f);
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + W + '" y2="' + y + '" stroke="' + GRID + '" stroke-width="0.3"/>';
    });
    dados.forEach(function (d, i) {
      series.forEach(function (s, j) {
        var v = num(d[s.key]);
        var h = (H - padT - padB) * (v / max);
        var x = padL + i * slot + (slot - bw * series.length) / 2 + j * bw;
        var y = H - padB - h;
        svg += '<rect x="' + x + '" y="' + y + '" width="' + (bw - 0.6) + '" height="' + Math.max(0.4, h) + '" rx="0.8" fill="' + s.cor + '"><title>' + esc(d.cidade || d.nome) + ' · ' + esc(s.rot) + ': ' + v + '</title></rect>';
      });
    });
    svg += "</svg>";
    // eixo x em HTML (fonte legível, sem distorção do viewBox)
    var eixo = '<div class="rg-x">' + dados.map(function (d) {
      return '<span>' + esc(d.cidade || d.nome) + '</span>';
    }).join("") + '</div>';
    var leg = '<div class="rg-leg">' + series.map(function (s) {
      return '<span><i style="background:' + s.cor + '"></i>' + esc(s.rot) + '</span>';
    }).join("") + '</div>';
    return '<div class="rg-chart">' + svg + eixo + leg + '</div>';
  }

  // Funil (contatos -> propostas -> vendas)
  function funil(etapas) {
    var max = Math.max.apply(null, etapas.map(function (e) { return num(e.valor); }).concat([1]));
    return '<div class="rg-funil">' + etapas.map(function (e) {
      var w = Math.max(6, safeDiv(e.valor, max) * 100);
      return '<div class="rg-funil-l">' +
               '<span class="rg-funil-n">' + esc(e.nome) + '</span>' +
               '<div class="rg-funil-bar"><i style="width:' + w + '%;background:' + e.cor + '"></i></div>' +
               '<span class="rg-funil-v">' + num(e.valor).toLocaleString("pt-BR") + '</span>' +
             '</div>';
    }).join("") + '</div>';
  }

  // ---- Estado ----
  var filiais = [], fonte = null, aba = "geral", filtroUf = "Todas", filialSel = null, ehSuper = false;

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

    var h = '<div class="rg-head">' +
      '<div><h2>Painel do gerente regional</h2>' +
        '<p>' + filiais.length + ' filial(is)' + (ufs.length ? " · " + ufs.join(" · ") : "") + '</p></div>' +
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
      h += '<div class="rg-card"><h3>Receita x meta por filial</h3>' +
        barras(src, [{ key: "receita", rot: "Receita", cor: NAVY }, { key: "meta_receita", rot: "Meta", cor: "#c7cbea" }]) + '</div>';
      h += '<div class="rg-card"><h3>Veículos protegidos x meta</h3>' +
        barras(src, [{ key: "veiculos", rot: "Veículos", cor: TURQ }, { key: "meta_veiculos", rot: "Meta", cor: "#c7cbea" }]) + '</div>';
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
        '<div class="rg-card"><h3>Conversão contato → venda</h3><div class="rg-conv">' +
          src.slice().sort(function (a, b) { return b.convContatoVenda - a.convContatoVenda; }).map(function (u) {
            return '<div class="rg-conv-l"><span>' + esc(u.cidade || u.nome) + '</span>' +
                   '<div class="rg-conv-bar"><i style="width:' + Math.min(100, u.convContatoVenda * 5) + '%"></i></div>' +
                   '<b>' + pct1(u.convContatoVenda) + '</b></div>';
          }).join("") + '</div></div></div>';
      h += tabela("Cancelamentos e inadimplência", ["Filial", "Vendas", "Cancelamentos", "Inadimplência"], src.map(function (u) {
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
        barras(src, [{ key: "vendedores_ativos", rot: "Ativos", cor: NAVY }, { key: "vendedores_meta", rot: "Quadro ideal", cor: "#c7cbea" }]) + '</div>';
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
        kpi("Premiações pagas", t.premiacoes, "no mês, na regional") +
        '</div>';
      if (t.trilhaBaixa.length) {
        h += '<div class="rg-alerta"><strong>' + t.trilhaBaixa.length + ' filial(is)</strong> com menos de 60% da trilha concluída: ' +
             esc(t.trilhaBaixa.map(function (u) { return u.cidade || u.nome; }).join(", ")) + '. Priorize o treinamento diário nessas unidades.</div>';
      }
      h += '<div class="rg-card"><h3>Progresso da trilha por filial</h3>' +
        barras(src, [{ key: "trilha_pct", rot: "Trilha concluída", cor: TURQ }, { key: "certificados_pct", rot: "Certificados", cor: "#c7cbea" }], { max: 100 }) + '</div>';
      h += tabela("Destaque da semana por filial", ["Filial", "Consultor destaque", "Vendas na semana", "Meta mensal (15)", "Premiações"], src.map(function (u) {
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
      h += tabela("Detalhamento por filial", ["Filial", "UF", "Veículos", "% meta veículos", "Receita", "% meta receita", "Crescimento"],
        src.slice().sort(function (a, b) { return b.receitaPct - a.receitaPct; }).map(function (u) {
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

  function tabela(titulo, cols, linhas, rodape) {
    return '<div class="rg-card"><h3>' + esc(titulo) + '</h3><div class="table-wrap"><table class="table"><thead><tr>' +
      cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + '</tr></thead><tbody>' +
      linhas.map(function (l) { return "<tr>" + l.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") +
      '</tbody></table></div>' + (rodape ? '<p class="rg-fonte">' + esc(rodape) + '</p>' : "") + '</div>';
  }

  // ---- Aba "Planilhas e dados" (só admin chega aqui) ----
  function abaFontes() {
    var h = '<div class="rg-card"><h3>Planilha do Google Drive</h3>' +
      '<p class="rg-p">Vincule a planilha que alimenta este painel. No Google Sheets: <strong>Arquivo → Compartilhar → Publicar na web</strong>, escolha a aba, formato <strong>CSV</strong>, e cole o link abaixo.</p>' +
      '<div class="rg-form">' +
        '<label>Link CSV publicado<input type="url" id="rgUrl" placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv" value="' + esc(fonte && fonte.url ? fonte.url : "") + '"></label>' +
        '<div class="rg-form-acts">' +
          '<button type="button" class="btn btn-primary btn-sm" id="rgSalvarUrl">Salvar e importar</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="rgSincronizar">Sincronizar agora</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="rgModelo">Baixar modelo CSV</button>' +
        '</div>' +
      '</div>';
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

  function sincronizarUrl(url) {
    if (!url) { msg("Informe o link CSV publicado da planilha.", false); return; }
    msg("Importando da planilha…", true);
    fetch(url, { credentials: "omit" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (txt) {
        if (/^\s*</.test(txt)) throw new Error("html");
        importarTexto(txt, url);
      })
      .catch(function (e) {
        msg('Não foi possível ler a planilha pelo link. Confirme que ela está "Publicada na web" em formato CSV — ou use a importação por colagem abaixo.', false);
      });
  }

  function modeloCSV() {
    var cab = COLUNAS.map(function (c) { return c.rot; }).join(",");
    var ex = COLUNAS.map(function (c) {
      if (c.key === "nome") return "Goiânia";
      if (c.key === "cidade") return "Goiânia";
      if (c.key === "uf") return "GO";
      if (c.key === "destaque_nome") return "Marcos Silva";
      return "0";
    }).join(",");
    var blob = new Blob(["﻿" + cab + "\n" + ex + "\n"], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "modelo-filiais-todos-protegidos.csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---- Eventos ----
  function ligar() {
    Array.prototype.forEach.call(root.querySelectorAll("[data-aba]"), function (b) {
      b.addEventListener("click", function () { aba = b.getAttribute("data-aba"); render(); });
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-uf]"), function (b) {
      b.addEventListener("click", function () { filtroUf = b.getAttribute("data-uf"); render(); });
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
      if (!url) { msg("Cole o link CSV publicado da planilha.", false); return; }
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
    var bTxt = document.getElementById("rgImportarTexto");
    if (bTxt) bTxt.addEventListener("click", function () {
      var t = (document.getElementById("rgColar").value || "").trim();
      if (!t) { msg("Cole os dados da planilha na caixa acima.", false); return; }
      importarTexto(t, "");
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
    return Promise.all([TPData.listFiliais(), TPData.getFonteFiliais()]).then(function (r) {
      filiais = (r[0] || []).map(function (f, i) { f.id = f.id || String(i); return f; });
      fonte = r[1] || fonte;
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
      root.innerHTML = '<div class="gestao-empty" style="padding:48px">Acesso restrito ao administrador.</div>';
      return;
    }
    ehSuper = s.role === "superadmin";
    carregar();
  }, function () { window.location.href = "login.html"; });
})();
