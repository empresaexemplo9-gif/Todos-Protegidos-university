// ============================================================
// TODOS PROTEGIDOS — Financeiro (livro caixa)
// ------------------------------------------------------------
// ACESSO: somente administrador. O RLS do Supabase também bloqueia no
// banco, então forçar a URL não expõe dado nenhum.
// Fonte dos números: planilha de lançamentos vinculada pelo admin.
// Gráficos: assets/js/graficos.js (o mesmo motor do Painel regional).
// ============================================================
(function () {
  "use strict";

  var root = document.getElementById("financeiroApp");
  if (!root || !window.TPData) return;

  var G = window.TPGraficos;
  var NAVY = "#1e3a8c", TURQ = "#14c2ad", GOLD = "#d4a94b",
      GREEN = "#0ba596", RED = "#d64545", ROXO = "#6b46c1", MUTED = "#7c879c";

  // ---- Colunas aceitas na planilha de lançamentos ----
  var COLUNAS = [
    { key: "data", rot: "Data", alias: ["data", "dia", "competencia", "data do lancamento"], txt: true },
    { key: "descricao", rot: "Descrição", alias: ["descricao", "historico", "lancamento"], txt: true },
    { key: "tipo", rot: "Tipo", alias: ["tipo", "natureza", "entrada saida"], txt: true },
    { key: "valor", rot: "Valor", alias: ["valor", "montante"] },
    { key: "categoria", rot: "Categoria", alias: ["categoria", "grupo"], txt: true },
    { key: "subcategoria", rot: "Subcategoria", alias: ["subcategoria", "conta"], txt: true },
    { key: "responsavel", rot: "Responsável", alias: ["responsavel"], txt: true },
    { key: "centro_custo", rot: "Centro de custo", alias: ["centro de custo", "centro custo", "filial", "unidade"], txt: true },
    { key: "contraparte", rot: "Contraparte", alias: ["contraparte", "cliente", "fornecedor"], txt: true },
    { key: "status", rot: "Status", alias: ["status", "situacao"], txt: true },
    { key: "pago_em", rot: "Pago em", alias: ["pago em", "data pagamento", "liquidado em"], txt: true },
    { key: "observacoes", rot: "Observações", alias: ["observacoes", "obs"], txt: true }
  ];

  // ---- Utilidades ----
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function brl(v) { return num(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); }
  function brl2(v) { return num(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }); }
  function pct1(v) { return num(v).toFixed(1).replace(".", ",") + "%"; }

  var MES_ROT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function rotuloMes(ym) {                       // "2026-07" -> "jul/26"
    var p = String(ym || "").split("-");
    if (p.length < 2) return String(ym || "");
    return MES_ROT[Number(p[1]) - 1] + "/" + p[0].slice(2);
  }
  function ehReceita(t) { return /^(receita|entrada|credito|crédito)/i.test(String(t || "").trim()); }

  // ---- Estado ----
  var lancamentos = [], fonte = null, aba = "geral", meses = 12, msgPendente = null;

  // ---- Agregações ----
  // Uma passada só: mês, categoria e situação saem juntos.
  function resumo(lista) {
    var porMes = {}, ordem = [], porCatDesp = {}, porCatRec = {};
    var rec = 0, desp = 0, aberto = { rec: 0, desp: 0 }, pago = 0;
    lista.forEach(function (l) {
      var v = num(l.valor), r = ehReceita(l.tipo);
      var ym = String(l.data || "").slice(0, 7);
      if (ym) {
        if (!porMes[ym]) { porMes[ym] = { ym: ym, rot: rotuloMes(ym), receita: 0, despesa: 0, resultado: 0 }; ordem.push(ym); }
        porMes[ym][r ? "receita" : "despesa"] += v;
      }
      if (r) { rec += v; } else { desp += v; }
      var alvo = r ? porCatRec : porCatDesp, c = l.categoria || "Sem categoria";
      alvo[c] = num(alvo[c]) + v;
      if (/aberto|pendente|previsto/i.test(l.status || "")) aberto[r ? "rec" : "desp"] += v;
      else pago += 1;
    });
    ordem.sort();
    var serie = ordem.map(function (ym) {
      var m = porMes[ym]; m.resultado = m.receita - m.despesa; return m;
    });
    function ranking(obj) {
      return Object.keys(obj).map(function (k) { return { nome: k, valor: obj[k] }; })
        .sort(function (a, b) { return b.valor - a.valor; });
    }
    return {
      serie: serie, receita: rec, despesa: desp, resultado: rec - desp,
      catDespesa: ranking(porCatDesp), catReceita: ranking(porCatRec),
      aberto: aberto, pagos: pago, n: lista.length
    };
  }

  function janela() {
    var r = resumo(lancamentos);
    return meses === 0 ? r.serie : r.serie.slice(-meses);
  }
  function listaJanela() {
    if (meses === 0) return lancamentos;
    var s = janela();
    if (!s.length) return lancamentos;
    var de = s[0].ym;
    return lancamentos.filter(function (l) { return String(l.data || "").slice(0, 7) >= de; });
  }

  // ---- Render ----
  function kpi(rot, val, sub, cor) {
    return '<div class="rg-kpi"><span class="rg-kpi-l">' + esc(rot) + '</span>' +
           '<div class="rg-kpi-v"' + (cor ? ' style="color:' + cor + '"' : "") + '>' + val + '</div>' +
           (sub ? '<div class="rg-kpi-s">' + sub + '</div>' : "") + '</div>';
  }

  function render() {
    var r = resumo(listaJanela());
    var serie = janela();
    var h = '<div class="rg-head"><div><h2 class="rg-title">Financeiro</h2>' +
      '<p class="rg-sub">' + r.n + ' lançamento(s)' + (serie.length ? ' — ' + esc(serie[0].rot) + ' a ' + esc(serie[serie.length - 1].rot) : "") + '</p></div>' +
      '<div class="rg-chips" style="margin-bottom:0">' +
        [[6, "6 meses"], [12, "12 meses"], [0, "Tudo"]].map(function (o) {
          return '<button type="button" class="rg-chip' + (meses === o[0] ? " on" : "") + '" data-meses="' + o[0] + '">' + o[1] + '</button>';
        }).join("") +
      '</div></div>';

    h += '<div class="rg-tabs">' +
      [["geral", "Visão geral"], ["categorias", "Categorias"], ["lancamentos", "Lançamentos"], ["fontes", "Planilha e dados"]]
        .map(function (a) {
          return '<button type="button" class="rg-tab' + (aba === a[0] ? " on" : "") + '" data-aba="' + a[0] + '">' + a[1] + '</button>';
        }).join("") + '</div>';

    if (!lancamentos.length && aba !== "fontes") {
      h += '<div class="gestao-empty" style="padding:40px">Nenhum lançamento ainda. Vá em <strong>Planilha e dados</strong> para importar o livro caixa.</div>';
      root.innerHTML = h; ligar(); return;
    }

    if (aba === "geral") {
      var margem = r.receita ? (r.resultado / r.receita) * 100 : 0;
      h += '<div class="rg-kpis">' +
        kpi("Entradas", brl(r.receita), "no período", GREEN) +
        kpi("Saídas", brl(r.despesa), "no período", RED) +
        kpi("Resultado", brl(r.resultado), "margem de " + pct1(margem), r.resultado >= 0 ? NAVY : RED) +
        kpi("Em aberto", brl(r.aberto.rec + r.aberto.desp),
            "a receber " + brl(r.aberto.rec) + " · a pagar " + brl(r.aberto.desp), GOLD) +
        '</div>';

      h += '<div class="rg-card"><h3>Entradas e saídas por mês</h3>' +
        G.barras(serie, [
          { key: "receita", rot: "Entradas", cor: GREEN },
          { key: "despesa", rot: "Saídas", cor: RED }
        ], { fmt: "moeda", titulo: "Entradas e saídas por mês" }) + '</div>';

      h += '<div class="rg-card"><h3>Resultado por mês</h3>' +
        G.linhas(serie, [{ key: "resultado", rot: "Resultado", cor: NAVY }],
          { fmt: "moeda", titulo: "Resultado por mês" }) +
        '<p class="rg-fonte">Resultado = entradas menos saídas de cada mês, pela data do lançamento.</p></div>';
    }

    if (aba === "categorias") {
      h += '<div class="rg-card"><h3>Para onde vai o dinheiro</h3>' +
        (r.catDespesa.length
          ? G.barrasH(r.catDespesa.map(function (c, i) {
              return { nome: c.nome, valor: c.valor, cor: [RED, "#e07a5f", GOLD, ROXO, MUTED, NAVY][i % 6] };
            }), { fmt: "moeda", titulo: "Despesas por categoria" })
          : '<div class="gestao-empty" style="padding:22px">Sem despesas no período.</div>') + '</div>';

      h += '<div class="rg-card"><h3>De onde vem o dinheiro</h3>' +
        (r.catReceita.length
          ? G.barrasH(r.catReceita.map(function (c, i) {
              return { nome: c.nome, valor: c.valor, cor: [GREEN, TURQ, NAVY, ROXO][i % 4] };
            }), { fmt: "moeda", titulo: "Receitas por categoria" })
          : '<div class="gestao-empty" style="padding:22px">Sem receitas no período.</div>') + '</div>';

      var tot = r.despesa || 1;
      h += tabela("Despesas em detalhe", ["Categoria", "Valor", "% do total"],
        r.catDespesa.map(function (c) {
          return ['<b>' + esc(c.nome) + '</b>', brl2(c.valor), pct1((c.valor / tot) * 100)];
        }));
    }

    if (aba === "lancamentos") {
      var l = listaJanela().slice(0, 200);
      h += tabela("Lançamentos (" + listaJanela().length + ")",
        ["Data", "Descrição", "Categoria", "Contraparte", "Status", "Valor"],
        l.map(function (x) {
          var r2 = ehReceita(x.tipo);
          return [
            esc(dataBR(x.data)), esc(x.descricao || "—"), esc(x.categoria || "—"),
            esc(x.contraparte || "—"),
            '<span class="rg-badge ' + (/aberto|pendente/i.test(x.status || "") ? "mid" : "good") + '">' + esc(x.status || "—") + '</span>',
            '<b style="color:' + (r2 ? GREEN : RED) + '">' + (r2 ? "+" : "−") + " " + brl2(x.valor) + '</b>'
          ];
        }),
        listaJanela().length > 200 ? "Mostrando os 200 mais recentes." : "");
    }

    if (aba === "fontes") h += abaFontes();

    root.innerHTML = h;
    if (msgPendente && document.getElementById("finMsg")) msg(msgPendente.txt, msgPendente.ok);
    ligar();
  }

  function dataBR(iso) {
    var p = String(iso || "").split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : (iso || "—");
  }

  function tabela(titulo, cols, linhas, rodape) {
    return '<div class="rg-card"><h3>' + esc(titulo) + '</h3><div class="table-wrap"><table class="table"><thead><tr>' +
      cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + '</tr></thead><tbody>' +
      linhas.map(function (l) { return "<tr>" + l.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") +
      '</tbody></table></div>' + (rodape ? '<p class="rg-fonte">' + esc(rodape) + '</p>' : "") + '</div>';
  }

  function abaFontes() {
    var h = '<div class="rg-card"><h3>Planilha do livro caixa</h3>' +
      '<p class="rg-p">Cole o link da planilha de lançamentos — serve o link de edição ou o CSV publicado. ' +
      'Para o painel ler sozinho, ela precisa estar em <strong>Arquivo → Compartilhar → Publicar na web</strong>, formato <strong>CSV</strong>.</p>' +
      '<div class="rg-form">' +
        '<label>Link da planilha<input type="url" id="finUrl" placeholder="https://docs.google.com/spreadsheets/d/.../edit" value="' + esc(fonte && fonte.url ? fonte.url : "") + '"></label>' +
        '<div class="rg-form-acts">' +
          '<button type="button" class="btn btn-primary btn-sm" id="finSalvarUrl">Salvar e importar</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="finSincronizar">Sincronizar agora</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="finModelo">Baixar modelo CSV</button>' +
        '</div></div>';
    if (fonte && fonte.ultima_sync) {
      h += '<p class="rg-sync">Última importação: ' + esc(new Date(fonte.ultima_sync).toLocaleString("pt-BR")) + ' · ' + num(fonte.linhas) + ' lançamento(s).</p>';
    }
    h += '<div id="finMsg" class="rg-msg"></div></div>';

    h += '<div class="rg-card"><h3>Importar por colagem</h3>' +
      '<p class="rg-p">Copie a planilha inteira (com a linha de títulos) e cole aqui — funciona com <strong>Ctrl+C / Ctrl+V</strong> direto do Google Sheets, ou envie o arquivo CSV. ' +
      'Cada importação <strong>substitui</strong> os lançamentos guardados, então colar a mesma planilha duas vezes não duplica nada.</p>' +
      '<textarea id="finColar" class="rg-textarea" placeholder="Cole aqui as células copiadas da planilha…"></textarea>' +
      '<div class="rg-form-acts">' +
        '<button type="button" class="btn btn-primary btn-sm" id="finImportar">Importar dados colados</button>' +
        '<label class="btn btn-ghost btn-sm" style="cursor:pointer">Enviar arquivo CSV<input type="file" id="finArquivo" accept=".csv,text/csv" hidden></label>' +
      '</div></div>';

    h += '<div class="rg-card"><h3>Colunas aceitas</h3>' +
      '<p class="rg-p">A primeira linha deve conter os títulos. A ordem não importa e colunas extras são ignoradas. ' +
      'Só <code>Data</code>, <code>Tipo</code> e <code>Valor</code> são obrigatórias.</p>' +
      '<div class="rg-cols">' + COLUNAS.map(function (c) { return '<code>' + esc(c.rot) + '</code>'; }).join("") + '</div></div>';
    return h;
  }

  // ---- CSV ----
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
  function normalizar(s) {
    return String(s || "").trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/r\$/g, "").replace(/[()%]/g, "")
      .replace(/[_.-]+/g, " ").replace(/\s+/g, " ").trim();
  }
  // Número no formato brasileiro: "R$ 122.024,73" = 122024.73
  function numeroBR(v) {
    var s = String(v == null ? "" : v).replace(/[R$\s%]/gi, "").trim();
    if (!s) return 0;
    var neg = /^\(.*\)$/.test(s) || s.indexOf("-") === 0;
    s = s.replace(/[()\-]/g, "");
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    var n = parseFloat(s);
    if (!isFinite(n)) return 0;
    return neg ? -n : n;
  }
  // Aceita dd/mm/aaaa e aaaa-mm-dd; devolve sempre aaaa-mm-dd (ordenável).
  function dataISO(v) {
    var s = String(v || "").trim();
    var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2);
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2);
    return "";
  }

  function csvParaLancamentos(texto) {
    var linhas = parseCSV(texto);
    if (linhas.length < 2) return { erro: "A planilha precisa da linha de títulos e de ao menos um lançamento." };

    // A linha de títulos pode não ser a primeira (planilhas costumam ter enfeite).
    var iCab = 0, melhor = -1;
    for (var i = 0; i < Math.min(linhas.length, 8); i++) {
      var cabT = linhas[i].map(normalizar), n = 0;
      COLUNAS.forEach(function (c) {
        if (cabT.indexOf(normalizar(c.rot)) >= 0 || c.alias.some(function (a) { return cabT.indexOf(normalizar(a)) >= 0; })) n++;
      });
      if (n > melhor) { melhor = n; iCab = i; }
    }
    var cab = linhas[iCab].map(normalizar);
    var mapa = {};
    COLUNAS.forEach(function (c) {
      for (var i2 = 0; i2 < cab.length; i2++) {
        if (!cab[i2]) continue;
        if (cab[i2] === normalizar(c.rot) || c.alias.some(function (a) { return normalizar(a) === cab[i2]; })) { mapa[c.key] = i2; break; }
      }
    });
    if (mapa.valor === undefined) return { erro: 'Não encontrei a coluna "Valor" na planilha.' };
    if (mapa.data === undefined) return { erro: 'Não encontrei a coluna "Data" na planilha.' };

    var out = [], semData = 0, semTipo = 0;
    for (var l = iCab + 1; l < linhas.length; l++) {
      var row = linhas[l];
      var data = dataISO(row[mapa.data]);
      var valor = numeroBR(row[mapa.valor]);
      if (!data && !valor) continue;
      if (!data) { semData++; continue; }

      var x = { data: data, valor: Math.abs(valor) };
      COLUNAS.forEach(function (c) {
        if (c.key === "data" || c.key === "valor" || mapa[c.key] === undefined) return;
        x[c.key] = String(row[mapa[c.key]] == null ? "" : row[mapa[c.key]]).trim();
      });
      COLUNAS.forEach(function (c) { if (x[c.key] === undefined) x[c.key] = c.txt ? "" : 0; });

      // Sem coluna de tipo, o sinal do valor decide: negativo é saída.
      if (mapa.tipo === undefined || !x.tipo) {
        x.tipo = valor < 0 ? "Despesa" : "Receita";
        if (mapa.tipo === undefined) semTipo++;
      }
      x.tipo = ehReceita(x.tipo) ? "Receita" : "Despesa";
      x.pago_em = dataISO(x.pago_em) || null;
      out.push(x);
    }
    if (!out.length) return { erro: "Nenhum lançamento válido encontrado na planilha." };
    out.sort(function (a, b) { return a.data < b.data ? 1 : a.data > b.data ? -1 : 0; });
    return { lancamentos: out, semData: semData, semTipo: semTipo };
  }

  function msg(txt, ok) {
    msgPendente = txt ? { txt: txt, ok: ok } : null;
    var el = document.getElementById("finMsg");
    if (!el) return;
    el.textContent = txt || "";
    el.className = "rg-msg" + (txt ? " show " + (ok ? "ok" : "err") : "");
  }

  function importarTexto(texto, origem) {
    var r = csvParaLancamentos(texto);
    if (r.erro) { msg(r.erro, false); return; }
    TPData.saveLancamentos(r.lancamentos).then(function (res) {
      if (res && res.ok === false) { msg(res.error || "Não foi possível salvar os lançamentos.", false); return; }
      var d = { nome: "Livro caixa", url: origem || (fonte && fonte.url) || "", ultima_sync: new Date().toISOString(), linhas: r.lancamentos.length };
      TPData.setFonteFinanceiro(d).then(function () { fonte = d; });
      msg(r.lancamentos.length + " lançamento(s) importado(s)." +
          (r.semData ? " " + r.semData + " linha(s) sem data foram ignoradas." : "") +
          (r.semTipo ? " Sem coluna “Tipo”: valores negativos entraram como saída." : ""), true);
      carregar(true);
    }, function () { msg("Erro ao salvar os lançamentos.", false); });
  }

  function sincronizarUrl(url) {
    var info = window.TPLinkPlanilha ? TPLinkPlanilha(url) : null;
    var alvos = info && info.csv && info.csv.length ? info.csv : [url];
    if (!url) { msg("Cole o link da planilha do livro caixa.", false); return; }
    msg("Importando da planilha…", true);
    var i = 0;
    (function tentar() {
      if (i >= alvos.length) {
        msg('Não consegui ler a planilha por esse link. Confirme que ela está publicada em CSV ("Arquivo → Compartilhar → Publicar na web") — ou use a importação por colagem abaixo.', false);
        return;
      }
      fetch(alvos[i++], { credentials: "omit" })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
        .then(function (t) { if (/^\s*</.test(t)) throw new Error("html"); importarTexto(t, url); })
        .catch(tentar);
    })();
  }

  function baixarCSV(nome, conteudo) {
    var blob = new Blob(["\ufeff" + conteudo], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---- Eventos ----
  function ligar() {
    Array.prototype.forEach.call(root.querySelectorAll("[data-aba]"), function (b) {
      b.addEventListener("click", function () { aba = b.getAttribute("data-aba"); render(); });
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-meses]"), function (b) {
      b.addEventListener("click", function () { meses = Number(b.getAttribute("data-meses")); render(); });
    });

    var bUrl = document.getElementById("finSalvarUrl");
    if (bUrl) bUrl.addEventListener("click", function () {
      var url = (document.getElementById("finUrl").value || "").trim();
      if (!url) { msg("Cole o link da planilha do livro caixa.", false); return; }
      TPData.setFonteFinanceiro({ nome: "Livro caixa", url: url }).then(function () {
        fonte = fonte || {}; fonte.url = url;
        sincronizarUrl(url);
      });
    });
    var bSync = document.getElementById("finSincronizar");
    if (bSync) bSync.addEventListener("click", function () {
      sincronizarUrl((document.getElementById("finUrl").value || "").trim());
    });
    var bMod = document.getElementById("finModelo");
    if (bMod) bMod.addEventListener("click", function () {
      baixarCSV("modelo-livro-caixa-todos-protegidos.csv",
        COLUNAS.map(function (c) { return c.rot; }).join(",") + "\n" +
        '01/07/2026,Mensalidade — associado,Receita,"R$ 129,90",Vendas,Proteção veicular,Consultor,Goiânia,Associado,Pago,01/07/2026,\n' +
        '05/07/2026,Folha de pagamento,Despesa,"R$ 41.450,00",Pessoal,Folha de pagamento,Financeiro,Goiânia,Folha consolidada,Pago,05/07/2026,\n');
    });
    var bImp = document.getElementById("finImportar");
    if (bImp) bImp.addEventListener("click", function () {
      var t = (document.getElementById("finColar").value || "").trim();
      if (!t) { msg("Cole os dados da planilha na caixa acima.", false); return; }
      importarTexto(t, "");
    });
    var bArq = document.getElementById("finArquivo");
    if (bArq) bArq.addEventListener("change", function () {
      var f = bArq.files && bArq.files[0]; if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { importarTexto(String(fr.result || ""), f.name); };
      fr.readAsText(f, "utf-8");
    });
  }

  // ---- Carga ----
  function carregar(manterAba) {
    return Promise.all([TPData.listLancamentos(), TPData.getFonteFinanceiro()]).then(function (r) {
      lancamentos = r[0] || [];
      fonte = r[1] || fonte;
      if (!manterAba && !lancamentos.length) aba = "fontes";
      render();
    }, function () {
      root.innerHTML = '<div class="gestao-empty" style="padding:40px">Financeiro indisponível. Rode <code>supabase/financeiro.sql</code> no Supabase para criar as tabelas.</div>';
    });
  }

  // ---- Porteiro: só administrador ----
  TPData.session().then(function (s) {
    if (!s) { window.location.href = "login.html"; return; }
    if (!(s.role === "admin" || s.role === "superadmin")) {
      if (window.TPLembrarPapel) TPLembrarPapel(s.role || "consultor");
      root.innerHTML = '<div class="gestao-empty" style="padding:48px">Acesso restrito ao administrador. Redirecionando…</div>';
      setTimeout(function () { window.location.replace("dashboard.html"); }, 900);
      return;
    }
    if (window.TPLembrarPapel) TPLembrarPapel(s.role);
    carregar();
  }, function () { window.location.href = "login.html"; });
})();
