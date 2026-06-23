// Todos Protegidos — interações leves da interface
(function () {
  "use strict";

  // Sessão / logout (via camada de dados TPData — Supabase ou local)
  function logout() {
    var done = function () { try { localStorage.removeItem("tp_sessao"); } catch (e) {} window.location.href = "index.html"; };
    if (window.TPData) { TPData.logout().then(done, done); } else { done(); }
  }
  // Rótulo de cargo/perfil exibido na interface
  function papelLabel(s) {
    if (!s) return "";
    if (s.titulo) return s.titulo;
    if (s.nome && /\bubirani\b/i.test(s.nome)) return "Presidente da empresa";
    if (s.role === "superadmin") return "Superadmin";
    if (s.role === "admin") return "Administrador";
    return "Consultor";
  }
  // Liga botões "Sair" estáticos (páginas sem topbar)
  Array.prototype.forEach.call(document.querySelectorAll("[data-logout]"), function (b) { b.addEventListener("click", logout); });

  // Guarda de sessão das páginas internas (body.dash): sem sessão -> login.
  // Cobre também a volta pelo botão "voltar" após logout (restauração via bfcache).
  if (document.body && document.body.classList.contains("dash") && window.TPData) {
    var sessionGuard = function () {
      TPData.session().then(function (s) { if (!s) window.location.replace("login.html"); }, function () {});
    };
    sessionGuard();
    window.addEventListener("pageshow", function (e) { if (e.persisted) sessionGuard(); });
  }

  // Menu mobile (landing) — alterna só a classe; o visual fica no CSS (.nav-links.nav-open)
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---- Manual de protocolos: checklists + conformidade ----
  var protos = document.querySelectorAll("[data-proto]");
  if (protos.length) {
    function refresh() {
      var allDone = 0, allTotal = 0;
      protos.forEach(function (card) {
        var boxes = card.querySelectorAll('input[type="checkbox"]');
        var done = card.querySelectorAll('input[type="checkbox"]:checked').length;
        allDone += done; allTotal += boxes.length;
        var pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
        var fill = card.querySelector("[data-fill]");
        var count = card.querySelector("[data-count]");
        if (fill) fill.style.width = pct + "%";
        if (count) count.textContent = done + "/" + boxes.length;
      });
      var gPct = allTotal ? Math.round((allDone / allTotal) * 100) : 0;
      var ring = document.getElementById("globalRing");
      var lbl = document.getElementById("globalPct");
      var gd = document.getElementById("globalDone");
      var gt = document.getElementById("globalTotal");
      var side = document.getElementById("sideCompliance");
      if (ring) ring.style.setProperty("--p", gPct);
      if (lbl) lbl.textContent = gPct + "%";
      if (gd) gd.textContent = allDone;
      if (gt) gt.textContent = allTotal;
      if (side) side.style.width = gPct + "%";
    }
    protos.forEach(function (card) {
      card.addEventListener("change", function (e) {
        if (e.target && e.target.type === "checkbox") refresh();
      });
    });
    refresh();
  }

  // ---- Abas (scripts / aula) com ARIA + teclado ----
  var tabs = document.querySelectorAll(".tab[data-tab]");
  if (tabs.length) {
    var panelFor = function (name) {
      var found = null;
      document.querySelectorAll(".tab-panel").forEach(function (p) { if (p.getAttribute("data-panel") === name) found = p; });
      return found;
    };
    var selectTab = function (tab) {
      var name = tab.getAttribute("data-tab");
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
      });
      document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.classList.toggle("active", p.getAttribute("data-panel") === name);
      });
    };
    tabs.forEach(function (tab, i) {
      var name = tab.getAttribute("data-tab");
      tab.setAttribute("role", "tab");
      if (!tab.id) tab.id = "tab-" + name;
      var panel = panelFor(name);
      if (panel) {
        if (!panel.id) panel.id = "panel-" + name;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        panel.setAttribute("tabindex", "0");
        tab.setAttribute("aria-controls", panel.id);
      }
      var on = tab.classList.contains("active");
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.setAttribute("tabindex", on ? "0" : "-1");
      tab.addEventListener("click", function () { selectTab(tab); });
      tab.addEventListener("keydown", function (e) {
        var k = e.keyCode || e.which;
        if (k === 39 || k === 37) {
          e.preventDefault();
          var next = tabs[(i + (k === 39 ? 1 : tabs.length - 1)) % tabs.length];
          next.focus(); selectTab(next);
        }
      });
    });
  }

  // ---- Baixar manual (PDF) via impressão ----
  var baixarManual = document.getElementById("baixarManual");
  if (baixarManual) baixarManual.addEventListener("click", function () { window.print(); });

  // ---- Gestão de conteúdo: módulos, aulas e vídeos (Supabase/local) ----
  var gestaoRoot = document.getElementById("gestaoRoot");
  if (gestaoRoot) {
    var ICONS = {
      video: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
      aula: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13.5"/><path d="M4 19.5 12 16l8 3.5"/><path d="M9 8h6M9 12h6"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
      file: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>'
    };
    var CHEV = '<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    var DEL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
    var LABELS = { video: "Vídeo", aula: "Aula", info: "Informação", file: "Material" };
    var TAGS = [
      "var(--tp-grad-brand)",
      "linear-gradient(135deg,var(--tp-blue-500),var(--tp-blue-900))",
      "linear-gradient(135deg,var(--tp-amber-400),var(--tp-amber-500))",
      "linear-gradient(135deg,var(--tp-green-700),var(--tp-blue-900))"
    ];

    var modulos = [];
    var openIds = {};
    var addModuloBtn = document.getElementById("addModulo");
    var resetBtn = document.getElementById("gestaoReset");

    function elt(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

    function reload() {
      return TPData.listModules().then(function (list) { modulos = list || []; render(); }, function () {
        gestaoRoot.innerHTML = '<div class="gestao-empty">Não foi possível carregar o conteúdo. Tente recarregar a página.</div>';
      });
    }

    function tagFor(i) { return TAGS[i % TAGS.length]; }
    function nTag(i) { return "M" + (i + 1); }

    function renderItem(mod, item) {
      var row = document.createElement("div");
      row.className = "content-item";
      row.innerHTML =
        '<span class="ci-ic ' + item.tipo + '">' + (ICONS[item.tipo] || ICONS.info) + '</span>' +
        '<div class="ci-body"><div class="t"></div><div class="d"></div></div>' +
        '<button class="ci-del" aria-label="Remover">' + DEL + '</button>';
      var sub = LABELS[item.tipo] || "Item";
      if (item.meta) sub += " · " + item.meta;
      if (item.desc) sub += " — " + item.desc;
      row.querySelector(".t").textContent = (item.url ? "▶ " : "") + item.titulo;
      row.querySelector(".d").textContent = sub;
      row.querySelector(".ci-del").addEventListener("click", function () {
        TPData.deleteItem(item.id).then(reload);
      });
      return row;
    }

    function renderModule(mod, i) {
      var card = document.createElement("section");
      card.className = "level-card" + (openIds[mod.id] ? " open" : "");

      var head = elt(
        '<div class="level-head">' +
          '<div class="level-tag" style="background:' + tagFor(i) + '">' + nTag(i) + '</div>' +
          '<div class="lvl-info"><h3></h3><div class="d"></div></div>' +
          '<div class="lvl-actions">' +
            '<a class="btn btn-ghost btn-sm" href="prova.html?modulo=' + mod.id + '" title="Editar a prova deste módulo">Prova</a>' +
            '<button class="lvl-del" title="Excluir módulo" aria-label="Excluir módulo">' + DEL + '</button>' +
            CHEV +
          '</div>' +
        '</div>'
      );
      head.querySelector("h3").textContent = mod.titulo;
      head.querySelector(".lvl-info .d").textContent = mod.sub || "";
      head.addEventListener("click", function (e) {
        if (e.target.closest(".lvl-del") || e.target.closest("a")) return;
        openIds[mod.id] = !openIds[mod.id]; card.classList.toggle("open", openIds[mod.id]);
      });
      head.querySelector(".lvl-del").addEventListener("click", function () {
        if (confirm("Excluir o módulo \"" + mod.titulo + "\" e todo o seu conteúdo?")) {
          TPData.deleteModule(mod.id).then(reload);
        }
      });
      card.appendChild(head);

      var body = document.createElement("div");
      body.className = "level-body";

      var list = document.createElement("div");
      list.className = "content-list";
      list.style.display = "grid";
      list.style.gap = "10px";
      list.style.marginBottom = "14px";
      mod.itens.forEach(function (item) { list.appendChild(renderItem(mod, item)); });
      body.appendChild(list);

      var toolbar = elt(
        '<div class="add-toolbar">' +
          '<button class="btn btn-ghost btn-sm" data-add="aula">+ Aula</button>' +
          '<button class="btn btn-ghost btn-sm" data-add="video">+ Vídeo</button>' +
          '<button class="btn btn-ghost btn-sm" data-add="info">+ Informação</button>' +
          '<button class="btn btn-ghost btn-sm" data-add="file">+ Material</button>' +
        '</div>'
      );
      body.appendChild(toolbar);

      var form = elt(
        '<form class="add-form">' +
          '<div class="field"><label data-label>Título</label><input class="input" data-f="title" placeholder="Ex.: Aula 1 — Fundamentos" required></div>' +
          '<div class="field-row">' +
            '<div class="field" data-url><label>URL do vídeo</label><input class="input" data-f="url" placeholder="https://..."></div>' +
            '<div class="field"><label>Duração / referência</label><input class="input" data-f="meta" placeholder="Ex.: 10:00"></div>' +
          '</div>' +
          '<div class="field" data-file><label>Enviar videoaula (arquivo)</label><input class="input" type="file" accept="video/*" data-f="arquivo"><span class="hint" style="display:block;font-size:var(--tp-fs-xs);color:var(--tp-muted);margin-top:5px">Faça upload do arquivo de vídeo ou cole a URL acima. (Upload disponível no modo nuvem.)</span></div>' +
          '<div class="field"><label>Descrição (opcional)</label><textarea data-f="desc" placeholder="Resumo do conteúdo..."></textarea></div>' +
          '<div class="form-actions" style="display:flex;gap:10px"><button type="submit" class="btn btn-primary btn-sm">Adicionar</button><button type="button" class="btn btn-ghost btn-sm" data-cancel>Cancelar</button></div>' +
        '</form>'
      );
      var current = "aula";
      var urlField = form.querySelector("[data-url]");
      var fileField = form.querySelector("[data-file]");
      var typeLabel = form.querySelector("[data-label]");

      toolbar.querySelectorAll("[data-add]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          current = btn.getAttribute("data-add");
          var ehVideo = (current === "video" || current === "aula");
          urlField.style.display = ehVideo ? "" : "none";
          fileField.style.display = ehVideo ? "" : "none";
          typeLabel.textContent = "Título d" + (current === "info" ? "a informação" : current === "file" ? "o material" : current === "aula" ? "a aula" : "o vídeo");
          form.classList.add("open");
          var t = form.querySelector('[data-f="title"]'); if (t) t.focus();
        });
      });
      form.querySelector("[data-cancel]").addEventListener("click", function () { form.classList.remove("open"); form.reset(); });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var get = function (k) { var el = form.querySelector('[data-f="' + k + '"]'); return el ? el.value.trim() : ""; };
        var titulo = get("title"); if (!titulo) return;
        var fileInput = form.querySelector('[data-f="arquivo"]');
        var file = fileInput && fileInput.files && fileInput.files[0];
        var sbtn = form.querySelector('button[type="submit"]');
        var finish = function (url) {
          TPData.addItem(mod.id, { tipo: current, titulo: titulo, meta: get("meta"), url: url || get("url"), desc: get("desc") }).then(function (r) {
            sbtn.disabled = false; sbtn.textContent = "Adicionar";
            if (r && r.ok === false) { alert(r.error || "Não foi possível adicionar."); return; }
            openIds[mod.id] = true; reload();
          });
        };
        sbtn.disabled = true;
        if (file) {
          sbtn.textContent = "Enviando vídeo…";
          TPData.uploadFile(file).then(function (u) {
            if (!u.ok) { sbtn.disabled = false; sbtn.textContent = "Adicionar"; alert(u.error || "Falha no upload do vídeo."); return; }
            finish(u.url);
          }, function () { sbtn.disabled = false; sbtn.textContent = "Adicionar"; alert("Falha no upload do vídeo."); });
        } else {
          finish("");
        }
      });
      body.appendChild(form);

      card.appendChild(body);
      return card;
    }

    function render() {
      gestaoRoot.innerHTML = "";
      if (!modulos.length) {
        gestaoRoot.appendChild(elt('<div class="gestao-empty">Nenhum módulo ainda. Clique em <strong>“+ Novo módulo”</strong> para começar.</div>'));
        return;
      }
      modulos.forEach(function (mod, i) { gestaoRoot.appendChild(renderModule(mod, i)); });
    }

    if (addModuloBtn) addModuloBtn.addEventListener("click", function () {
      var nome = prompt("Nome do módulo:", "Novo módulo");
      if (nome === null) return;
      nome = nome.trim(); if (!nome) return;
      var desc = prompt("Descrição do módulo (opcional):", "") || "";
      TPData.addModule(nome, desc.trim()).then(function (r) {
        if (!r || r.ok === false) { alert((r && r.error) || "Não foi possível criar o módulo."); return; }
        if (r.module) openIds[r.module.id] = true;
        reload().then(function () {
          if (gestaoRoot.lastChild && gestaoRoot.lastChild.scrollIntoView) gestaoRoot.lastChild.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });
    });

    if (resetBtn) {
      if (TPData.configured()) { resetBtn.style.display = "none"; }
      else resetBtn.addEventListener("click", function () {
        if (confirm("Restaurar a trilha padrão? As alterações salvas neste navegador serão perdidas.")) {
          TPData.resetModules().then(reload);
        }
      });
    }

    function restrito() {
      if (addModuloBtn) addModuloBtn.style.display = "none";
      if (resetBtn) resetBtn.style.display = "none";
      gestaoRoot.innerHTML =
        '<div class="gestao-empty" style="padding:48px 32px">' +
          '<div style="font-family:var(--tp-font-sans);font-weight:800;font-size:var(--tp-fs-xl);color:var(--tp-ink);margin-bottom:8px">Acesso restrito</div>' +
          '<p style="max-width:42ch;margin:0 auto 18px">Esta área é exclusiva para <strong>administradores</strong>. Faça login com uma conta de administrador para gerenciar módulos, aulas e vídeos.</p>' +
          '<a href="login.html" class="btn btn-primary btn-sm">Entrar como administrador</a>' +
        '</div>';
    }

    // Carrega após checar a sessão (somente admin)
    gestaoRoot.innerHTML = '<div class="gestao-empty">Carregando…</div>';
    TPData.session().then(function (sess) {
      if (!(sess && sess.role === "admin")) { restrito(); return; }
      reload();
    }, function () { restrito(); });
  }

  // ---- Manual do consultor: orientações (CRUD restrito a admin/presidente) ----
  var manualRoot = document.getElementById("manualRoot");
  if (manualRoot) {
    var M_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    var M_TRASH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
    var manEsc = function (s) { return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
    var manItens = [], manPodeEditar = false;
    var manAddBtn = document.getElementById("addManual");
    var manActions = document.getElementById("manualActions");

    function manFind(id) { return manItens.filter(function (x) { return x.id === id; })[0]; }
    function manEmpty(msg) { manualRoot.innerHTML = '<div class="gestao-empty" style="padding:32px">' + msg + '</div>'; }

    function manRender() {
      if (!manItens.length) {
        manEmpty(manPodeEditar
          ? 'Nenhuma orientação cadastrada ainda. Clique em <strong>“+ Nova orientação”</strong> para começar.'
          : 'Nenhuma orientação publicada ainda. Assim que a direção publicar, ela aparece aqui.');
        return;
      }
      manualRoot.innerHTML = manItens.map(function (it) {
        var tools = manPodeEditar
          ? '<div style="display:flex;gap:6px;margin-left:auto"><button class="btn btn-ghost btn-sm" data-medit="' + it.id + '">' + M_EDIT + ' Editar</button><button class="btn btn-ghost btn-sm" data-mdel="' + it.id + '">' + M_TRASH + ' Excluir</button></div>'
          : '';
        return '<section class="card" style="padding:22px 24px">' +
          '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">' +
            '<h3 style="margin:0;font-family:var(--tp-font-sans);font-size:var(--tp-fs-lg);color:var(--tp-ink)">' + manEsc(it.titulo) + '</h3>' + tools +
          '</div>' +
          '<div class="muted" style="white-space:pre-line;line-height:1.7;color:var(--tp-slate)">' + manEsc(it.conteudo) + '</div>' +
        '</section>';
      }).join("");
      Array.prototype.forEach.call(manualRoot.querySelectorAll("[data-medit]"), function (b) { b.addEventListener("click", function () { manForm(manFind(b.getAttribute("data-medit"))); }); });
      Array.prototype.forEach.call(manualRoot.querySelectorAll("[data-mdel]"), function (b) { b.addEventListener("click", function () { manDel(manFind(b.getAttribute("data-mdel"))); }); });
    }

    function manForm(it) {
      var editing = !!it; it = it || {};
      var ov = document.createElement("div"); ov.className = "modal-overlay";
      ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' +
        '<h3 style="margin:0">' + (editing ? "Editar orientação" : "Nova orientação") + '</h3>' +
        '<form class="m-form">' +
          '<label class="m-field"><span>Título*</span><input name="titulo" type="text" value="' + manEsc(it.titulo) + '" placeholder="Ex.: Diretriz de Atendimento aos Associados"></label>' +
          '<label class="m-field"><span>Texto / mensagem*</span><textarea name="conteudo" rows="10" placeholder="Escreva a orientação...">' + manEsc(it.conteudo) + '</textarea></label>' +
          '<div class="m-msg" hidden></div>' +
          '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px"><button type="button" class="btn btn-ghost btn-sm" data-cancel>Cancelar</button><button type="submit" class="btn btn-primary btn-sm">' + (editing ? "Salvar" : "Publicar") + '</button></div>' +
        '</form></div>';
      document.body.appendChild(ov); document.body.classList.add("nav-locked");
      function close() { ov.parentNode && ov.parentNode.removeChild(ov); document.body.classList.remove("nav-locked"); }
      ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
      ov.querySelector("[data-cancel]").addEventListener("click", close);
      var form = ov.querySelector(".m-form");
      var tEl = form.querySelector('[name="titulo"]'); if (tEl) tEl.focus();
      function msg(t) { var m = form.querySelector(".m-msg"); m.textContent = t; m.hidden = false; }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var titulo = (form.querySelector('[name="titulo"]').value || "").trim();
        var conteudo = (form.querySelector('[name="conteudo"]').value || "").trim();
        if (!titulo) return msg("Informe um título.");
        if (!conteudo) return msg("Escreva o texto da orientação.");
        var btn = form.querySelector('[type="submit"]'); btn.disabled = true;
        var p = editing ? TPData.updateManual(it.id, { titulo: titulo, conteudo: conteudo }) : TPData.addManual({ titulo: titulo, conteudo: conteudo });
        p.then(function (res) {
          btn.disabled = false;
          if (res && res.ok === false) return msg(res.error || "Não foi possível salvar.");
          close(); manReload();
        }, function () { btn.disabled = false; msg("Erro de conexão. Tente novamente."); });
      });
    }

    function manDel(it) {
      if (!it) return;
      if (!window.confirm('Excluir a orientação "' + it.titulo + '"? Esta ação não pode ser desfeita.')) return;
      TPData.deleteManual(it.id).then(manReload);
    }

    function manReload() {
      manEmpty("Carregando…");
      return TPData.listManual().then(function (list) { manItens = list || []; manRender(); },
        function () { manEmpty('Não foi possível carregar o manual. Se a tabela ainda não existe no Supabase, rode <code>supabase/manual.sql</code> no SQL Editor.'); });
    }

    if (manAddBtn) manAddBtn.addEventListener("click", function () { manForm(null); });
    manEmpty("Carregando…");
    TPData.session().then(function (s) {
      if (!s) { window.location.href = "login.html"; return; }
      manPodeEditar = s.role === "admin" || s.role === "superadmin";
      if (manPodeEditar && manActions) manActions.style.display = "flex";
      manReload();
    }, function () { manReload(); });
  }

  // ---- Institucional: apresentação da empresa (texto único editável) ----
  var institucionalRoot = document.getElementById("institucionalRoot");
  if (institucionalRoot) {
    var instEsc = function (s) { return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
    var instConteudo = "", instPodeEditar = false;

    function instView() {
      var temTexto = (instConteudo || "").trim().length > 0;
      var editBtn = instPodeEditar
        ? '<div style="margin-bottom:16px"><button class="btn btn-primary btn-sm" id="instEditBtn">' + (temTexto ? "Editar apresentação" : "Adicionar apresentação") + '</button></div>'
        : "";
      var corpo;
      if (temTexto) {
        corpo = '<section class="card" style="padding:28px 30px;line-height:1.8;white-space:pre-line;color:var(--tp-slate);font-size:var(--tp-fs-md)">' + instEsc(instConteudo) + '</section>';
      } else {
        corpo = '<div class="gestao-empty" style="padding:44px 32px">' +
          (instPodeEditar
            ? 'Apresentação da empresa ainda não preenchida. Clique em <strong>“Adicionar apresentação”</strong> para escrever o texto institucional (história, missão, visão, valores, palavra do presidente).'
            : 'A apresentação da empresa aparece aqui assim que a direção publicá-la.') +
          '</div>';
      }
      institucionalRoot.innerHTML = editBtn + corpo;
      var b = document.getElementById("instEditBtn");
      if (b) b.addEventListener("click", instEdit);
    }

    function instEdit() {
      institucionalRoot.innerHTML =
        '<section class="card" style="padding:22px 24px">' +
          '<label class="m-field"><span style="font-weight:600">Apresentação da empresa</span>' +
          '<textarea id="instTexto" rows="18" style="width:100%;line-height:1.7" placeholder="Escreva aqui a apresentação da Todos Protegidos: história, missão, visão, valores e a palavra do presidente."></textarea></label>' +
          '<div class="m-msg" id="instMsg" hidden></div>' +
          '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px">' +
            '<button class="btn btn-ghost btn-sm" id="instCancel">Cancelar</button>' +
            '<button class="btn btn-primary btn-sm" id="instSave">Salvar</button>' +
          '</div>' +
        '</section>';
      var ta = document.getElementById("instTexto");
      if (ta) { ta.value = instConteudo || ""; ta.focus(); }
      document.getElementById("instCancel").addEventListener("click", instView);
      document.getElementById("instSave").addEventListener("click", function () {
        var novo = (document.getElementById("instTexto").value || "").trim();
        var msg = document.getElementById("instMsg");
        var sv = document.getElementById("instSave"); sv.disabled = true;
        TPData.saveInstitucional(novo).then(function (r) {
          sv.disabled = false;
          if (r && r.ok === false) { msg.textContent = r.error || "Não foi possível salvar."; msg.hidden = false; return; }
          instConteudo = novo; instView();
        }, function () { sv.disabled = false; msg.textContent = "Erro de conexão. Tente novamente."; msg.hidden = false; });
      });
    }

    institucionalRoot.innerHTML = '<div class="gestao-empty" style="padding:32px">Carregando…</div>';
    TPData.session().then(function (s) {
      if (!s) { window.location.href = "login.html"; return; }
      instPodeEditar = s.role === "admin" || s.role === "superadmin";
      TPData.getInstitucional().then(function (c) { instConteudo = c || ""; instView(); },
        function () { institucionalRoot.innerHTML = '<div class="gestao-empty" style="padding:40px">Não foi possível carregar a apresentação. Se a tabela ainda não existe no Supabase, rode <code>supabase/institucional.sql</code>.</div>'; });
    }, function () { window.location.href = "login.html"; });
  }

  // ---- Operação (CRM): dados vindos do Power CRM ----
  var operacaoApp = document.getElementById("operacaoApp");
  if (operacaoApp) {
    var opEsc = function (s) { return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
    var opBRL = function (n) { n = Number(n); return isFinite(n) && n ? "R$ " + n.toFixed(2).replace(".", ",") : "—"; };
    var opData = function (s) { if (!s) return "—"; var d = new Date(s); return isNaN(d) ? "—" : d.toLocaleDateString("pt-BR"); };
    var opKpi = function (val, lbl) { return '<div class="kpi"><div class="val">' + val + '</div><div class="lbl">' + lbl + '</div></div>'; };
    function opTabela(titulo, n, cols, rows) {
      var h = '<section class="panel"><div class="panel-head"><h3 style="margin:0">' + titulo + '</h3><span class="badge">' + n + '</span></div>';
      if (!n) { h += '<div class="gestao-empty" style="padding:24px">Nada recebido ainda.</div></section>'; return h; }
      h += '<div class="table-wrap"><table class="table"><thead><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join("") + '</tr></thead><tbody>' + rows + '</tbody></table></div></section>';
      return h;
    }

    operacaoApp.innerHTML = '<div class="gestao-empty" style="padding:32px">Carregando…</div>';
    TPData.session().then(function (s) {
      if (!s) { window.location.href = "login.html"; return; }
      if (!(s.role === "admin" || s.role === "superadmin")) { operacaoApp.innerHTML = '<div class="gestao-empty" style="padding:48px">Acesso restrito a administradores.</div>'; return; }
      Promise.all([TPData.listCrmCotacoes(), TPData.listCrmClientes(), TPData.listCrmVistorias(), TPData.listCrmContratos()]).then(function (res) {
        var cot = res[0] || [], cli = res[1] || [], vis = res[2] || [], con = res[3] || [];
        if (!cot.length && !cli.length && !vis.length && !con.length) {
          operacaoApp.innerHTML = '<div class="gestao-empty" style="padding:44px 32px">' +
            '<div style="font-family:var(--tp-font-sans);font-weight:800;font-size:var(--tp-fs-xl);color:var(--tp-ink);margin-bottom:8px">Aguardando dados do Power CRM</div>' +
            '<p style="max-width:54ch;margin:0 auto">Assim que a integração com o Power CRM estiver configurada (webhook apontando para a função <code>powercrm-webhook</code>), as cotações, cadastros, vistorias e contratos aparecem aqui automaticamente.</p>' +
            '<p style="max-width:54ch;margin:10px auto 0;color:var(--tp-muted);font-size:var(--tp-fs-sm)">Passo a passo da configuração: arquivo <code>POWERCRM.md</code> no repositório.</p>' +
            '</div>';
          return;
        }
        var html = '<div class="v-summary">' +
          opKpi(cot.length, "Cotações") + opKpi(cli.length, "Clientes/Leads") +
          opKpi(vis.length, "Vistorias") + opKpi(con.length, "Contratos") + '</div>';

        html += opTabela("Cotações", cot.length, ["Data", "Cliente", "Veículo", "Plano", "Valor", "Status", "Consultor"],
          cot.map(function (c) {
            return '<tr><td>' + opData(c.criado_em) + '</td><td style="font-weight:600">' + (opEsc(c.nome) || "—") + '</td><td>' + (opEsc(c.veiculo) || "—") + '</td><td>' + (opEsc(c.plano) || "—") + '</td><td>' + opBRL(c.valor) + '</td><td><span class="badge badge-blue">' + (opEsc(c.status) || "—") + '</span></td><td>' + (opEsc(c.consultor) || "—") + '</td></tr>';
          }).join(""));

        html += opTabela("Vistorias", vis.length, ["Data", "Cliente", "Veículo", "Código (Visto)", "Link", "Status"],
          vis.map(function (v) {
            var link = v.link_visto ? '<a href="' + opEsc(v.link_visto).replace(/"/g, "%22") + '" target="_blank" rel="noopener">abrir</a>' : "—";
            return '<tr><td>' + opData(v.criado_em) + '</td><td style="font-weight:600">' + (opEsc(v.nome) || "—") + '</td><td>' + (opEsc(v.veiculo) || "—") + '</td><td>' + (opEsc(v.codigo_visto) || "—") + '</td><td>' + link + '</td><td><span class="badge badge-amber">' + (opEsc(v.status) || "—") + '</span></td></tr>';
          }).join(""));

        html += opTabela("Contratos de adesão", con.length, ["Data", "Cliente", "Plano", "Valor", "Status", "Documento"],
          con.map(function (c) {
            var link = c.url ? '<a href="' + opEsc(c.url).replace(/"/g, "%22") + '" target="_blank" rel="noopener">abrir</a>' : "—";
            return '<tr><td>' + opData(c.criado_em) + '</td><td style="font-weight:600">' + (opEsc(c.nome) || "—") + '</td><td>' + (opEsc(c.plano) || "—") + '</td><td>' + opBRL(c.valor) + '</td><td><span class="badge">' + (opEsc(c.status) || "—") + '</span></td><td>' + link + '</td></tr>';
          }).join(""));

        html += opTabela("Clientes / Leads", cli.length, ["Data", "Nome", "Telefone", "Veículo", "Status"],
          cli.map(function (c) {
            return '<tr><td>' + opData(c.criado_em) + '</td><td style="font-weight:600">' + (opEsc(c.nome) || "—") + '</td><td>' + (opEsc(c.telefone) || "—") + '</td><td>' + (opEsc(c.veiculo) || "—") + '</td><td>' + (opEsc(c.status) || "—") + '</td></tr>';
          }).join(""));

        operacaoApp.innerHTML = html;
      }, function () { operacaoApp.innerHTML = '<div class="gestao-empty" style="padding:40px">Não foi possível carregar os dados. Se as tabelas ainda não existem no Supabase, rode <code>supabase/crm.sql</code>.</div>'; });
    }, function () { window.location.href = "login.html"; });
  }

  // ---- Trilha resumida + progresso real no dashboard ----
  var trilhaLista = document.getElementById("trilhaLista");
  if (trilhaLista) {
    var escT = function (s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
    var setTxt = function (id, t) { var e = document.getElementById(id); if (e) e.textContent = t; };
    var setW = function (id, w) { var e = document.getElementById(id); if (e) e.style.width = w; };
    function nivelInfo(pct) {
      if (pct >= 80) return { nome: "Pro", tag: "🏆 Nível Pro" };
      if (pct >= 50) return { nome: "Avançado", tag: "🥇 Nível Avançado" };
      if (pct >= 25) return { nome: "Intermediário", tag: "🥈 Nível Intermediário" };
      return { nome: "Novato", tag: "🏁 Nível Novato" };
    }
    Promise.all([TPData.listModules(), TPData.getProgress()]).then(function (res) {
      var mods = res[0] || [], done = res[1] || [];
      function isD(id) { return done.indexOf(id) >= 0; }
      var total = 0, dn = 0;
      mods.forEach(function (m) { (m.itens || []).forEach(function (it) { total++; if (isD(it.id)) dn++; }); });
      var pct = total ? Math.round(dn / total * 100) : 0;
      var info = nivelInfo(pct);
      setTxt("welcomePct", pct + "%");
      setTxt("welcomeLevel", info.tag);
      setTxt("welcomeText", total ? ("Sua trilha está " + pct + "% concluída — " + dn + " de " + total + " aulas. Continue de onde parou.") : "Sua trilha aparece aqui assim que a gestão publicar os módulos.");
      setTxt("sideLevel", info.nome);
      setW("sideProg", pct + "%");
      setTxt("sideHint", total ? (dn >= total ? "Trilha concluída! 🎉" : "Faltam " + (total - dn) + " aula(s) para 100%") : "Comece sua trilha para evoluir");
      setTxt("kpiAulas", String(dn));

      if (!mods.length) {
        trilhaLista.innerHTML = '<div class="gestao-empty" style="padding:28px">Sua trilha aparece aqui assim que a gestão publicar os módulos.<div style="margin-top:12px"><a class="btn btn-primary btn-sm" href="gestao.html">Ir para a gestão</a></div></div>';
        return;
      }
      var html = "";
      mods.forEach(function (m) {
        var n = (m.itens || []).length, d2 = 0;
        (m.itens || []).forEach(function (it) { if (isD(it.id)) d2++; });
        var full = n > 0 && d2 >= n;
        var step = full
          ? '<div class="track-step done"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>'
          : '<div class="track-step current">' + d2 + '</div>';
        html += '<div class="track-item">' + step +
          '<div class="track-body"><div class="t">' + escT(m.titulo) + '</div><div class="d">' + escT(m.sub || "") + (m.sub ? " · " : "") + d2 + '/' + n + ' concluídas</div></div>';
        var firstVid = (m.itens || []).filter(function (it) { return it.tipo === "aula" || it.tipo === "video"; })[0];
        if (firstVid) html += '<a class="btn ' + (full ? "btn-ghost" : "btn-primary") + ' btn-sm" href="aula.html?item=' + encodeURIComponent(firstVid.id) + '">' + (full ? "Revisar" : "Assistir") + '</a>';
        else html += '<a class="btn btn-ghost btn-sm" href="aula.html">Abrir</a>';
        html += '</div>';
      });
      trilhaLista.innerHTML = html;
    }, function () { trilhaLista.innerHTML = '<div class="gestao-empty" style="padding:24px">Não foi possível carregar a trilha.</div>'; });
  }

  // ---- Player da trilha (consultor) ----
  var playerApp = document.getElementById("playerApp");
  if (playerApp) {
    var esc = function (s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
    var TYPELBL = { aula: "Aula", video: "Vídeo", info: "Informação", file: "Material" };
    function isPlayable(it) { return it.tipo === "aula" || it.tipo === "video"; }
    function embed(url) {
      var box = "position:relative;aspect-ratio:16/9;border-radius:var(--tp-radius-lg);overflow:hidden;background:#000;box-shadow:var(--tp-shadow)";
      var fill = "position:absolute;inset:0;width:100%;height:100%;border:0";
      if (!url) return '<div class="video"><div class="meta"><span class="badge">Sem vídeo nesta aula</span></div></div>';
      var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
      if (yt) return '<div style="' + box + '"><iframe style="' + fill + '" src="https://www.youtube.com/embed/' + yt[1] + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
      var vm = url.match(/vimeo\.com\/(\d+)/);
      if (vm) return '<div style="' + box + '"><iframe style="' + fill + '" src="https://player.vimeo.com/video/' + vm[1] + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
      return '<div style="' + box + '"><video controls preload="metadata" style="' + fill + '" src="' + esc(url).replace(/"/g, "%22") + '"></video></div>';
    }
    function flatten(mods) { var l = []; mods.forEach(function (m) { (m.itens || []).forEach(function (it) { l.push({ mod: m, item: it }); }); }); return l; }

    var doneSet = [], modulesCache = [];
    function isDone(id) { return doneSet.indexOf(id) >= 0; }
    function modDone(m) { var d = 0; (m.itens || []).forEach(function (it) { if (isDone(it.id)) d++; }); return d; }
    var ICODONE = '<span class="ic done"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>';
    var ICOPLAY = '<span class="ic now"><svg width="14" height="14" viewBox="0 0 24 24" fill="#081042"><path d="M8 5v14l11-7z"/></svg></span>';

    function renderPlayer(mods, currentId) {
      var flat = flatten(mods);
      if (!flat.length) { playerApp.innerHTML = '<div class="gestao-empty" style="padding:48px">Nenhuma aula publicada ainda. Assim que a gestão adicionar conteúdo, ele aparece aqui.</div>'; return; }
      var sel = null;
      flat.forEach(function (e) { if (e.item.id === currentId) sel = e; });
      if (!sel) sel = flat.filter(function (e) { return isPlayable(e.item); })[0] || flat[0];
      var done = isDone(sel.item.id);

      var html = '<div class="crumb" style="font-size:var(--tp-fs-sm);color:var(--tp-muted);margin-bottom:14px"><a href="dashboard.html" style="color:var(--tp-muted)">Visão geral</a> · ' + esc(sel.mod.titulo) + '</div>';
      html += '<div class="lesson-grid"><div>';
      if (isPlayable(sel.item)) html += embed(sel.item.url);
      else html += '<div class="video"><div class="meta"><span class="badge">' + esc(TYPELBL[sel.item.tipo] || "Conteúdo") + '</span></div></div>';
      html += '<div class="lesson-body">';
      html += '<span class="badge badge-amber" style="margin-top:18px">' + esc(sel.mod.titulo) + '</span>';
      html += '<h2>' + esc(sel.item.titulo) + '</h2>';
      html += '<p class="muted" style="white-space:pre-line">' + (sel.item.desc ? esc(sel.item.desc) : (sel.item.meta ? esc(sel.item.meta) : "—")) + '</p>';
      html += '<div class="lesson-actions">';
      html += '<button class="btn ' + (done ? "btn-ghost" : "btn-primary") + '" id="btnDone">' + (done ? "✓ Concluída — desmarcar" : "Marcar como concluída") + '</button>';
      if (sel.item.url && !isPlayable(sel.item)) html += '<a class="btn btn-ghost" href="' + esc(sel.item.url).replace(/"/g, "%22") + '" target="_blank" rel="noopener">Abrir material</a>';
      html += '</div>';
      html += '</div></div>';

      html += '<aside class="playlist">';
      mods.forEach(function (m) {
        if (!(m.itens || []).length) return;
        var dn = modDone(m), tot = m.itens.length, pct = Math.round(dn / tot * 100);
        html += '<div class="playlist-head"><h3>' + esc(m.titulo) + '</h3><div class="d">' + dn + '/' + tot + ' concluídas</div><div class="progress" style="margin-top:8px"><i style="width:' + pct + '%"></i></div></div>';
        m.itens.forEach(function (it) {
          var active = it.id === sel.item.id ? " active" : "";
          var ico = isDone(it.id) ? ICODONE : (isPlayable(it) ? ICOPLAY : '<span class="ic next">•</span>');
          html += '<a class="lesson' + active + '" href="aula.html?item=' + encodeURIComponent(it.id) + '" style="text-decoration:none;color:inherit">' + ico + '<div class="t">' + esc(it.titulo) + '<small>' + esc(TYPELBL[it.tipo] || "") + (it.meta ? " · " + esc(it.meta) : "") + '</small></div></a>';
        });
        html += '<a class="lesson" href="quiz.html?modulo=' + encodeURIComponent(m.id) + '" style="text-decoration:none;color:inherit"><span class="ic next">★</span><div class="t">Prova do módulo<small>Quiz · libera certificado</small></div></a>';
      });
      html += '</aside></div>';
      playerApp.innerHTML = html;

      var b = document.getElementById("btnDone");
      if (b) b.addEventListener("click", function () {
        b.disabled = true;
        var novo = !isDone(sel.item.id);
        TPData.setProgress(sel.item.id, novo).then(function (r) {
          if (r && r.ok === false) { b.disabled = false; alert(r.error || "Não foi possível salvar o progresso."); return; }
          if (novo) { if (doneSet.indexOf(sel.item.id) < 0) doneSet.push(sel.item.id); }
          else doneSet = doneSet.filter(function (x) { return x !== sel.item.id; });
          renderPlayer(modulesCache, sel.item.id);
        }, function () { b.disabled = false; alert("Erro de conexão ao salvar o progresso."); });
      });
    }

    var wantId = new URLSearchParams(location.search).get("item");
    TPData.session().then(function (s) {
      if (!s) { window.location.href = "login.html"; return; }
      Promise.all([TPData.listModules(), TPData.getProgress()]).then(function (res) {
        modulesCache = res[0] || []; doneSet = res[1] || [];
        renderPlayer(modulesCache, wantId);
      }, function () {
        playerApp.innerHTML = '<div class="gestao-empty" style="padding:40px">Não foi possível carregar as aulas. Recarregue a página.</div>';
      });
    }, function () { window.location.href = "login.html"; });
  }

  // ---- Avaliação / prova do módulo (dinâmica) + certificado ----
  var quizForm = document.getElementById("quizForm");
  if (quizForm) {
    var PASS = 0.7;
    var modId = new URLSearchParams(location.search).get("modulo");
    var qWrap = document.getElementById("quizQuestoes");
    var answeredEl = document.getElementById("answered");
    var barEl = document.getElementById("quizBar");
    var sessao = null, moduloTitulo = "", total = 0;
    function escq(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
    function setT(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }

    function updateProgress() {
      var done = 0, qs = quizForm.querySelectorAll("[data-q]");
      qs.forEach(function (q) { if (q.querySelector("input:checked")) done++; });
      if (answeredEl) answeredEl.textContent = done;
      if (barEl) barEl.style.width = total ? Math.round((done / total) * 100) + "%" : "0%";
    }

    function buildQuiz(questoes) {
      total = questoes.length;
      var minimo = Math.ceil(PASS * total);
      setT("quizTotal", String(total));
      setT("quizCount", total + (total === 1 ? " questão" : " questões"));
      setT("quizDesc", "Responda às questões com base no que você aprendeu" + (moduloTitulo ? " em " + moduloTitulo : "") + ". É preciso acertar no mínimo 70% (" + minimo + " de " + total + ") para liberar o certificado.");
      var html = "";
      questoes.forEach(function (q, qi) {
        html += '<div class="quiz-q" data-q><div class="qhead"><span class="qn">' + (qi + 1) + '</span><div class="qtitle">' + escq(q.enunciado) + '</div></div>';
        (q.opcoes || []).forEach(function (op, oi) {
          html += '<label class="opt"><input type="radio" name="q_' + escq(q.id) + '"' + (oi === q.correta ? ' data-correct' : '') + '><span class="mark"></span><span class="otext">' + escq(op) + '</span></label>';
        });
        html += '</div>';
      });
      qWrap.innerHTML = html;
      updateProgress();
    }

    quizForm.addEventListener("change", function (e) { if (e.target && e.target.type === "radio") updateProgress(); });

    quizForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!total) return;
      var correct = 0, qs = quizForm.querySelectorAll("[data-q]");
      qs.forEach(function (q) {
        var chosen = q.querySelector("input:checked");
        q.classList.add("graded");
        var right = q.querySelector("input[data-correct]");
        if (right) { var rightOpt = right.closest(".opt"); rightOpt.classList.add("correct"); if (!rightOpt.querySelector(".res")) { var s = document.createElement("span"); s.className = "res"; s.textContent = "✓ correta"; rightOpt.appendChild(s); } }
        if (chosen) {
          if (chosen.hasAttribute("data-correct")) correct++;
          else { var wrongOpt = chosen.closest(".opt"); wrongOpt.classList.add("wrong"); var w = document.createElement("span"); w.className = "res"; w.textContent = "✗ sua resposta"; wrongOpt.appendChild(w); }
        }
        q.querySelectorAll("input").forEach(function (i) { i.disabled = true; });
      });

      var pct = Math.round((correct / total) * 100);
      var passed = correct / total >= PASS;
      if (modId && TPData.saveQuizResult) TPData.saveQuizResult(modId, pct, passed);
      var minimo = Math.ceil(PASS * total);
      var result = document.getElementById("quizResult");
      setT("quizScore", pct + "%");
      setT("quizMsg", passed ? "Parabéns, você foi aprovado! 🎉" : "Quase lá — não foi dessa vez.");
      setT("quizSub", "Você acertou " + correct + " de " + total + " questões." + (passed ? " Seu certificado foi liberado abaixo." : " A nota mínima é 70% (" + minimo + " de " + total + "). Revise o conteúdo e tente novamente."));
      result.className = "quiz-result quiz-print-hide show " + (passed ? "pass" : "fail");
      document.getElementById("quizSubmit").style.display = "none";
      document.getElementById("quizReset").style.display = "";

      if (passed) {
        var cw = document.getElementById("certWrap"); cw.classList.add("show");
        setT("certScore", pct + "%");
        var d = new Date();
        setT("certDate", d.toLocaleDateString("pt-BR"));
        var validId = "TP-" + d.getFullYear() + "-" + String(Date.now()).slice(-6);
        setT("certId", validId);
        if (sessao) setT("certName", sessao.nome);
        setT("certModulo", moduloTitulo || "—");
        if (TPData.addCertificate) TPData.addCertificate({ modulo_id: modId, modulo_titulo: moduloTitulo, score: pct, id_validacao: validId, data: d.toISOString().slice(0, 10) });
        cw.scrollIntoView({ behavior: "smooth" });
      } else { result.scrollIntoView({ behavior: "smooth" }); }
    });

    var resetBtn = document.getElementById("quizReset");
    if (resetBtn) resetBtn.addEventListener("click", function () { location.reload(); });

    TPData.session().then(function (s) {
      if (!s) { window.location.href = "login.html"; return; }
      sessao = s;
      if (!modId) { if (qWrap) qWrap.innerHTML = '<div class="gestao-empty">Selecione um módulo na trilha para fazer a prova.</div>'; document.getElementById("quizSubmit").style.display = "none"; return; }
      Promise.all([TPData.listModules(), TPData.listQuestions(modId)]).then(function (res) {
        var mods = res[0] || [], questoes = res[1] || [];
        var m = mods.filter(function (x) { return x.id === modId; })[0];
        moduloTitulo = m ? m.titulo : "";
        var sub = document.querySelector(".topbar .sub"); if (sub && m) sub.textContent = m.titulo;
        if (!questoes.length) {
          var ehAdmin = s.role === "admin" || s.role === "superadmin";
          if (qWrap) qWrap.innerHTML = '<div class="gestao-empty" style="padding:40px">A prova deste módulo ainda não foi cadastrada.' + (ehAdmin ? '<div style="margin-top:12px"><a class="btn btn-primary btn-sm" href="prova.html?modulo=' + encodeURIComponent(modId) + '">Cadastrar prova</a></div>' : '') + '</div>';
          var qi = document.getElementById("quizIntro"); if (qi) qi.style.display = "none";
          document.getElementById("quizSubmit").style.display = "none";
          return;
        }
        buildQuiz(questoes);
      });
    }, function () { window.location.href = "login.html"; });
  }

  // ---- Editor de prova (admin) ----
  var provaApp = document.getElementById("provaApp");
  if (provaApp) {
    var pModId = new URLSearchParams(location.search).get("modulo");
    var pTitleEl = document.getElementById("provaTitulo");
    function pesc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
    var questoesCache = [], editId = null;

    function renderLista() {
      var box = document.getElementById("provaLista");
      if (!questoesCache.length) { box.innerHTML = '<div class="gestao-empty" style="padding:24px">Nenhuma questão ainda. Use o formulário para adicionar (meta: 10 questões).</div>'; return; }
      var html = "";
      questoesCache.forEach(function (q, i) {
        html += '<div class="card" style="margin-bottom:12px"><div style="display:flex;gap:10px;align-items:flex-start"><span class="badge">' + (i + 1) + '</span><div style="flex:1"><strong style="font-family:var(--tp-font-sans)">' + pesc(q.enunciado) + '</strong><ul style="margin:8px 0 0;padding:0;list-style:none">';
        (q.opcoes || []).forEach(function (op, oi) {
          html += '<li style="padding:3px 0;color:' + (oi === q.correta ? "var(--tp-green-700);font-weight:600" : "var(--tp-slate)") + '">' + (oi === q.correta ? "✓ " : "• ") + pesc(op) + '</li>';
        });
        html += '</ul></div><div style="display:flex;flex-direction:column;gap:6px"><button class="btn btn-ghost btn-sm" data-edit="' + q.id + '">Editar</button><button class="btn btn-ghost btn-sm" data-del="' + q.id + '">Excluir</button></div></div></div>';
      });
      box.innerHTML = html;
      box.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { if (confirm("Excluir esta questão?")) TPData.deleteQuestion(b.getAttribute("data-del")).then(reloadQ); }); });
      box.querySelectorAll("[data-edit]").forEach(function (b) { b.addEventListener("click", function () { startEdit(b.getAttribute("data-edit")); }); });
    }

    function startEdit(id) {
      var q = questoesCache.filter(function (x) { return x.id === id; })[0]; if (!q) return;
      editId = id;
      document.getElementById("pEnunciado").value = q.enunciado;
      for (var i = 0; i < 4; i++) { document.getElementById("pOp" + i).value = (q.opcoes && q.opcoes[i]) || ""; }
      var radios = document.getElementsByName("pCorreta"); if (radios[q.correta]) radios[q.correta].checked = true;
      document.getElementById("pFormTitle").textContent = "Editar questão";
      document.getElementById("pSubmit").textContent = "Salvar alteração";
      document.getElementById("pCancel").style.display = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function resetForm() {
      editId = null;
      document.getElementById("provaForm").reset();
      document.getElementById("pFormTitle").textContent = "Adicionar questão";
      document.getElementById("pSubmit").textContent = "Adicionar questão";
      document.getElementById("pCancel").style.display = "none";
    }
    function reloadQ() {
      return TPData.listQuestions(pModId).then(function (qs) { questoesCache = qs || []; renderLista(); var c = document.getElementById("provaContador"); if (c) c.textContent = questoesCache.length + "/10"; });
    }

    var pmsg = document.getElementById("provaMsg");
    function pShow(t, ok) { pmsg.textContent = t; pmsg.className = "form-msg show " + (ok ? "ok" : "err"); }

    document.getElementById("provaForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var enun = document.getElementById("pEnunciado").value.trim();
      var ops = []; for (var i = 0; i < 4; i++) { ops.push(document.getElementById("pOp" + i).value.trim()); }
      var radios = document.getElementsByName("pCorreta"), correctIdx = -1;
      for (var j = 0; j < radios.length; j++) { if (radios[j].checked) correctIdx = parseInt(radios[j].value, 10); }
      if (!enun) return pShow("Escreva o enunciado da questão.", false);
      if (ops.filter(function (x) { return x; }).length < 2) return pShow("Preencha pelo menos 2 alternativas.", false);
      if (correctIdx < 0 || !ops[correctIdx]) return pShow("Marque a alternativa correta (e ela não pode estar vazia).", false);
      var novas = [], novoCorreto = 0;
      ops.forEach(function (v, idx) { if (v) { if (idx === correctIdx) novoCorreto = novas.length; novas.push(v); } });
      var payload = { enunciado: enun, opcoes: novas, correta: novoCorreto };
      var btn = document.getElementById("pSubmit"); btn.disabled = true;
      var fin = function (r) { btn.disabled = false; if (r && r.ok === false) return pShow(r.error || "Não foi possível salvar.", false); pShow("Questão salva! ✓", true); resetForm(); reloadQ(); };
      if (editId) TPData.updateQuestion(editId, payload).then(fin); else TPData.addQuestion(pModId, payload).then(fin);
    });
    document.getElementById("pCancel").addEventListener("click", resetForm);

    TPData.session().then(function (s) {
      if (!s) { window.location.href = "login.html"; return; }
      if (!(s.role === "admin" || s.role === "superadmin")) { provaApp.innerHTML = '<div class="gestao-empty" style="padding:48px">Acesso restrito a administradores.</div>'; return; }
      if (!pModId) { provaApp.innerHTML = '<div class="gestao-empty" style="padding:48px">Módulo não informado. Abra pelo botão “Prova” na Gestão de conteúdo.</div>'; return; }
      TPData.listModules().then(function (mods) {
        var m = (mods || []).filter(function (x) { return x.id === pModId; })[0];
        if (pTitleEl) pTitleEl.textContent = m ? ("Prova — " + m.titulo) : "Prova do módulo";
        reloadQ();
      });
    }, function () { window.location.href = "login.html"; });
  }

  // ---- Painel do admin: progresso da equipe ----
  var equipeApp = document.getElementById("equipeApp");
  if (equipeApp) {
    var eesc = function (s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
    TPData.session().then(function (s) {
      if (!s) { window.location.href = "login.html"; return; }
      if (!(s.role === "admin" || s.role === "superadmin")) { equipeApp.innerHTML = '<div class="gestao-empty" style="padding:48px">Acesso restrito a administradores.</div>'; return; }
      Promise.all([TPData.listModules(), TPData.listTeam(), TPData.listAllProgress(), TPData.listAllResults(), TPData.listQuizModules()]).then(function (res) {
        var mods = res[0] || [], team = res[1] || [], prog = res[2] || [], results = res[3] || [], quizMods = res[4] || [];
        var totalItens = 0; mods.forEach(function (m) { totalItens += (m.itens || []).length; });
        var totalProvas = quizMods.length;
        var byUser = {};
        prog.forEach(function (p) { (byUser[p.user_id] = byUser[p.user_id] || {})[p.item_id] = 1; });
        var byRes = {};
        results.forEach(function (r) { if (r.aprovado) (byRes[r.user_id] = byRes[r.user_id] || {})[r.modulo_id] = 1; });
        var consultores = team.filter(function (u) { return u.role === "consultor"; });
        var lista = consultores.length ? consultores : team;

        var somaPct = 0, concluintes = 0, somaProvas = 0;
        var linhas = lista.map(function (u) {
          var done = byUser[u.id] || {};
          var d = Object.keys(done).length;
          var pct = totalItens ? Math.round(d / totalItens * 100) : 0;
          somaPct += pct; if (totalItens && d >= totalItens) concluintes++;
          var modsComp = 0; mods.forEach(function (m) { var its = (m.itens || []); if (its.length && its.every(function (it) { return done[it.id]; })) modsComp++; });
          var aprov = byRes[u.id] || {};
          var provasOk = 0; quizMods.forEach(function (mid) { if (aprov[mid]) provasOk++; });
          somaProvas += provasOk;
          var papel = u.titulo || (u.role === "admin" ? "Administrador" : u.role === "superadmin" ? "Superadmin" : "Consultor");
          return { nome: u.nome, papel: papel, d: d, pct: pct, modsComp: modsComp, provasOk: provasOk };
        }).sort(function (a, b) { return b.pct - a.pct; });

        var media = lista.length ? Math.round(somaPct / lista.length) : 0;
        var resumo = document.getElementById("equipeResumo");
        if (resumo) resumo.innerHTML =
          '<div class="kpi"><div class="val">' + lista.length + '</div><div class="lbl">Consultores</div></div>' +
          '<div class="kpi"><div class="val">' + media + '%</div><div class="lbl">Progresso médio</div></div>' +
          '<div class="kpi"><div class="val">' + concluintes + '</div><div class="lbl">Concluíram a trilha</div></div>' +
          '<div class="kpi"><div class="val">' + somaProvas + '</div><div class="lbl">Provas aprovadas</div></div>';

        if (!lista.length) { equipeApp.innerHTML = '<div class="gestao-empty" style="padding:40px">Nenhum consultor cadastrado ainda.</div>'; return; }

        var html = '<div class="panel"><div class="panel-head"><h3>Consultores</h3><span class="badge">' + lista.length + '</span></div><table class="table"><thead><tr><th>Consultor</th><th>Perfil</th><th>Aulas</th><th>Progresso</th><th>Módulos</th><th>Provas aprovadas</th></tr></thead><tbody>';
        linhas.forEach(function (r) {
          html += '<tr><td>' + eesc(r.nome) + '</td><td>' + eesc(r.papel) + '</td><td>' + r.d + '/' + totalItens + '</td>' +
                  '<td style="min-width:150px"><div class="progress" style="display:inline-block;width:90px;vertical-align:middle"><i style="width:' + r.pct + '%"></i></div> ' + r.pct + '%</td>' +
                  '<td>' + r.modsComp + '/' + mods.length + '</td>' +
                  '<td>' + r.provasOk + '/' + totalProvas + '</td></tr>';
        });
        html += '</tbody></table></div>';
        equipeApp.innerHTML = html;
      }, function () { equipeApp.innerHTML = '<div class="gestao-empty" style="padding:40px">Não foi possível carregar os dados da equipe.</div>'; });
    }, function () { window.location.href = "login.html"; });
  }

  // ---- Cadastro do consultor (criar o próprio acesso) ----
  var cadastroForm = document.getElementById("cadastroForm");
  if (cadastroForm) {
    var msg = document.getElementById("formMsg");
    function showMsg(text, ok) {
      msg.textContent = text;
      msg.className = "form-msg show " + (ok ? "ok" : "err");
      if (!ok) msg.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }

    cadastroForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = val("nome"), email = val("email").toLowerCase();
      var telefone = val("telefone"), senha = val("senha"), senha2 = val("senha2");
      var empresa = val("empresa");
      var termos = document.getElementById("termos");

      if (!nome || nome.split(" ").length < 2) return showMsg("Informe seu nome completo.", false);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showMsg("Digite um e-mail válido.", false);
      if (!empresa) return showMsg("Informe o código da empresa/unidade.", false);
      if (senha.length < 6) return showMsg("A senha deve ter pelo menos 6 caracteres.", false);
      if (senha !== senha2) return showMsg("As senhas não conferem.", false);
      if (termos && !termos.checked) return showMsg("É preciso aceitar os termos para continuar.", false);

      var btn = cadastroForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      TPData.register({ nome: nome, email: email, telefone: telefone, senha: senha, tenant: empresa }).then(function (r) {
        if (!r.ok) { btn.disabled = false; return showMsg(r.error || "Não foi possível criar o acesso.", false); }
        if (r.needsConfirm) {
          showMsg("Acesso criado! Confirme o e-mail enviado e depois faça login.", true);
          return setTimeout(function () { window.location.href = "login.html"; }, 2400);
        }
        showMsg("Acesso criado com sucesso! Redirecionando para a plataforma…", true);
        setTimeout(function () { window.location.href = "dashboard.html"; }, 1400);
      }, function () { btn.disabled = false; showMsg("Erro de conexão. Tente novamente.", false); });
    });
  }

  // ---- Login (consultor + administrador) ----
  var loginForm = document.getElementById("loginForm");
  if (loginForm) {
    var lmsg = document.getElementById("loginMsg");
    function lShow(text, ok) {
      lmsg.textContent = text;
      lmsg.className = "form-msg show " + (ok ? "ok" : "err");
    }
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var user = (document.getElementById("login").value || "").trim();
      var pass = document.getElementById("senha").value || "";
      if (!user || !pass) return lShow("Preencha usuário e senha.", false);

      var btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      TPData.login(user, pass).then(function (r) {
        if (!r.ok) { btn.disabled = false; return lShow(r.error || "Usuário ou senha inválidos.", false); }
        var nome = (r.session && r.session.nome) || "";
        lShow((r.session && r.session.role === "admin") ? "Bem-vindo, Administrador! Redirecionando…" : ("Acesso liberado" + (nome ? ", " + nome.split(" ")[0] : "") + "! Redirecionando…"), true);
        setTimeout(function () { window.location.href = "dashboard.html"; }, 1000);
      }, function () { btn.disabled = false; lShow("Erro de conexão. Tente novamente.", false); });
    });
  }

  // ---- Minha conta (editar dados da conta) ----
  var contaForm = document.getElementById("contaForm");
  if (contaForm) {
    var cmsg = document.getElementById("contaMsg");
    var emailAtual = "";
    function cShow(t, ok) { cmsg.textContent = t; cmsg.className = "form-msg show " + (ok ? "ok" : "err"); if (!ok) cmsg.scrollIntoView({ behavior: "smooth", block: "center" }); }
    function cv(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }

    TPData.session().then(function (s) {
      if (!s) { window.location.href = "login.html"; return; }
      emailAtual = s.email || "";
      var e = document.getElementById("c_email"); if (e) e.value = s.email || "";
      var n = document.getElementById("c_nome"); if (n) n.value = s.nome || "";
      var t = document.getElementById("c_telefone"); if (t) t.value = s.telefone || "";
      var p = document.getElementById("contaPerfil");
      if (p) p.textContent = papelLabel(s) + " · atualize seus dados pessoais e sua senha.";
    }, function () { window.location.href = "login.html"; });

    contaForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = cv("c_nome"), telefone = cv("c_telefone"), emailNovo = cv("c_email").toLowerCase();
      var senha = document.getElementById("c_senha").value || "";
      var senha2 = document.getElementById("c_senha2").value || "";
      if (!nome) return cShow("Informe seu nome.", false);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailNovo)) return cShow("Digite um e-mail válido.", false);
      if (senha || senha2) {
        if (senha.length < 6) return cShow("A nova senha deve ter pelo menos 6 caracteres.", false);
        if (senha !== senha2) return cShow("As senhas não conferem.", false);
      }

      var trocouEmail = emailNovo !== (emailAtual || "").toLowerCase();
      var passos = [function () { return TPData.updateProfile({ nome: nome, telefone: telefone }); }];
      if (trocouEmail) passos.push(function () { return TPData.updateEmail(emailNovo); });
      if (senha) passos.push(function () { return TPData.updatePassword(senha); });

      var btn = contaForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      var p = Promise.resolve({ ok: true });
      passos.forEach(function (step) { p = p.then(function (prev) { return (prev && prev.ok === false) ? prev : step(); }); });
      p.then(function (last) {
        btn.disabled = false;
        if (last && last.ok === false) return cShow(last.error || "Não foi possível salvar tudo.", false);
        document.getElementById("c_senha").value = ""; document.getElementById("c_senha2").value = "";
        if (trocouEmail) {
          emailAtual = emailNovo;
          return cShow("Dados salvos! Para concluir a troca de login, confirme pelo link enviado a " + emailNovo + " (se a confirmação de e-mail estiver ativa).", true);
        }
        cShow("Dados atualizados com sucesso! ✓", true);
      }, function () { btn.disabled = false; cShow("Erro de conexão. Tente novamente.", false); });
    });
  }

  // ---- Meus clientes: CRUD (Supabase/local) ----
  var clientesRoot = document.getElementById("clientesRoot");
  if (clientesRoot) {
    var C_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    var C_TRASH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
    var C_STATUS = { lead: "Lead", ativo: "Ativo", inativo: "Inativo" };
    var clientes = [];
    var addBtn = document.getElementById("addCliente");

    function cEsc(s) { return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function cIni(n) { return (n || "?").split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join("").toUpperCase(); }
    function cBadge(s) { return s === "ativo" ? "badge" : s === "inativo" ? "badge badge-danger" : "badge badge-blue"; }
    function cFind(id) { return clientes.filter(function (c) { return c.id === id; })[0]; }
    function cEmpty(msg) { clientesRoot.innerHTML = '<div class="gestao-empty">' + msg + '</div>'; }

    function cRender() {
      if (!clientes.length) { cEmpty('Você ainda não cadastrou clientes. Clique em <strong>“+ Novo cliente”</strong> para começar.'); return; }
      var rows = clientes.map(function (c) {
        return '<tr>' +
          '<td><div class="who"><span class="avatar-sm">' + cIni(c.nome) + '</span><div><div style="font-weight:600">' + cEsc(c.nome) + '</div><div class="muted" style="font-size:var(--tp-fs-xs)">' + cEsc(c.email) + '</div></div></div></td>' +
          '<td>' + (cEsc(c.telefone) || "—") + '</td>' +
          '<td>' + (cEsc(c.veiculo) || "—") + '</td>' +
          '<td><span class="' + cBadge(c.status) + '">' + (C_STATUS[c.status] || "—") + '</span></td>' +
          '<td style="text-align:right;white-space:nowrap"><button class="icon-btn-sm" data-edit="' + c.id + '" aria-label="Editar">' + C_EDIT + '</button> <button class="icon-btn-sm" data-del="' + c.id + '" aria-label="Excluir">' + C_TRASH + '</button></td>' +
          '</tr>';
      }).join("");
      clientesRoot.innerHTML = '<div class="card" style="padding:6px"><div class="table-wrap"><table class="table"><thead><tr><th>Cliente</th><th>Telefone</th><th>Veículo</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
      Array.prototype.forEach.call(clientesRoot.querySelectorAll("[data-edit]"), function (b) { b.addEventListener("click", function () { cForm(cFind(b.getAttribute("data-edit"))); }); });
      Array.prototype.forEach.call(clientesRoot.querySelectorAll("[data-del]"), function (b) { b.addEventListener("click", function () { cDel(cFind(b.getAttribute("data-del"))); }); });
    }

    function cField(label, name, val, type) {
      return '<label class="m-field"><span>' + label + '</span><input name="' + name + '" type="' + (type || "text") + '" value="' + cEsc(val) + '"></label>';
    }
    function cForm(c) {
      var editing = !!c; c = c || {};
      var ov = document.createElement("div"); ov.className = "modal-overlay";
      ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' +
        '<h3 style="margin:0">' + (editing ? "Editar cliente" : "Novo cliente") + '</h3>' +
        '<form class="m-form">' +
          cField("Nome*", "nome", c.nome) +
          '<div class="m-row">' + cField("Telefone / WhatsApp", "telefone", c.telefone) + cField("E-mail", "email", c.email, "email") + '</div>' +
          '<div class="m-row">' + cField("Documento (CPF/CNPJ)", "documento", c.documento) + cField("Veículo", "veiculo", c.veiculo) + '</div>' +
          '<label class="m-field"><span>Status</span><select name="status">' +
            ["lead", "ativo", "inativo"].map(function (s) { return '<option value="' + s + '"' + (c.status === s ? " selected" : "") + '>' + C_STATUS[s] + '</option>'; }).join("") +
          '</select></label>' +
          '<label class="m-field"><span>Observações</span><textarea name="obs" rows="2">' + cEsc(c.obs) + '</textarea></label>' +
          '<div class="m-msg" hidden></div>' +
          '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px"><button type="button" class="btn btn-ghost btn-sm" data-cancel>Cancelar</button><button type="submit" class="btn btn-primary btn-sm">' + (editing ? "Salvar" : "Adicionar") + '</button></div>' +
        '</form></div>';
      document.body.appendChild(ov); document.body.classList.add("nav-locked");
      function close() { ov.parentNode && ov.parentNode.removeChild(ov); document.body.classList.remove("nav-locked"); }
      ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
      ov.querySelector("[data-cancel]").addEventListener("click", close);
      var form = ov.querySelector(".m-form");
      var nameInput = form.querySelector('[name="nome"]'); if (nameInput) nameInput.focus();
      function msg(t) { var m = form.querySelector(".m-msg"); m.textContent = t; m.hidden = false; }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var d = {};
        Array.prototype.forEach.call(form.querySelectorAll("[name]"), function (el) { d[el.name] = (el.value || "").trim(); });
        if (!d.nome) return msg("Informe o nome do cliente.");
        var btn = form.querySelector('[type="submit"]'); btn.disabled = true;
        var p = editing ? TPData.updateCliente(c.id, d) : TPData.addCliente(d);
        p.then(function (res) {
          btn.disabled = false;
          if (res && res.ok === false) return msg(res.error || "Não foi possível salvar.");
          close(); cReload();
        }, function () { btn.disabled = false; msg("Erro de conexão. Tente novamente."); });
      });
    }

    function cDel(c) {
      if (!c) return;
      if (!window.confirm('Excluir o cliente "' + c.nome + '"? Esta ação não pode ser desfeita.')) return;
      TPData.deleteCliente(c.id).then(cReload);
    }

    function cReload() {
      cEmpty("Carregando clientes…");
      return TPData.listClientes().then(function (list) { clientes = list || []; cRender(); },
        function () { cEmpty('Não foi possível carregar seus clientes. Se as tabelas ainda não existem no Supabase, rode <code>db/migrations.sql</code> no SQL Editor.'); });
    }

    if (addBtn) addBtn.addEventListener("click", function () { cForm(null); });
    if (window.TPData) {
      TPData.session().then(function (s) {
        if (!s) { window.location.href = "login.html"; return; }
        cReload();
      }, function () { cReload(); });
    } else { cReload(); }
  }

  // ---- Helpers de vendas (compartilhados: página de vendas + dashboard) ----
  var V_STATUS = { ativa: "Ativa", pendente: "Pendente", cancelada: "Cancelada" };
  function vBRL(n) { n = Number(n) || 0; return "R$ " + n.toFixed(2).replace(".", ","); }
  function vEsc(s) { return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function vStatusBadge(s) { return s === "ativa" ? "badge" : s === "cancelada" ? "badge badge-danger" : "badge badge-amber"; }
  function vIsMonth(dateStr, d) { d = d || new Date(); return !!dateStr && String(dateStr).slice(0, 7) === (d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2)); }
  function vDateBR(s) { if (!s) return "—"; var p = String(s).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : s; }

  // ---- Minhas vendas: CRUD (Supabase/local) ----
  var vendasRoot = document.getElementById("vendasRoot");
  if (vendasRoot) {
    var V_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    var V_TRASH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
    var vendas = [], vClientes = [];
    var addVendaBtn = document.getElementById("addVenda");

    function vEmpty(msg) { vendasRoot.innerHTML = '<div class="gestao-empty">' + msg + '</div>'; }
    function vFind(id) { return vendas.filter(function (v) { return v.id === id; })[0]; }
    function vKpi(lbl, val) { return '<div class="kpi"><div class="val" style="font-size:var(--tp-fs-2xl)">' + val + '</div><div class="lbl">' + lbl + '</div></div>'; }
    function vFieldI(label, name, val, type) { return '<label class="m-field"><span>' + label + '</span><input name="' + name + '" type="' + (type || "text") + '"' + (type === "number" ? ' step="0.01" min="0"' : '') + ' value="' + vEsc(val) + '"></label>'; }

    function vRender() {
      var now = new Date(), comMes = 0, qtdMes = 0, comTotal = 0;
      vendas.forEach(function (v) {
        if (v.status === "cancelada") return;
        comTotal += Number(v.comissao) || 0;
        if (vIsMonth(v.data, now)) { comMes += Number(v.comissao) || 0; qtdMes++; }
      });
      var cards = '<div class="v-summary">' + vKpi("Comissão no mês", vBRL(comMes)) + vKpi("Vendas no mês", String(qtdMes)) + vKpi("Comissão total", vBRL(comTotal)) + '</div>';
      var body;
      if (!vendas.length) {
        body = '<div class="gestao-empty">Nenhuma venda registrada. Clique em <strong>“+ Nova venda”</strong> para começar.</div>';
      } else {
        var rows = vendas.map(function (v) {
          return '<tr><td>' + vDateBR(v.data) + '</td><td style="font-weight:600">' + (vEsc(v.cliente_nome) || "—") + '</td><td>' + (vEsc(v.plano) || "—") + '</td><td>' + (vEsc(v.veiculo) || "—") + '</td><td>' + vBRL(v.comissao) + '</td><td><span class="' + vStatusBadge(v.status) + '">' + (V_STATUS[v.status] || "—") + '</span></td><td style="text-align:right;white-space:nowrap"><button class="icon-btn-sm" data-vedit="' + v.id + '" aria-label="Editar">' + V_EDIT + '</button> <button class="icon-btn-sm" data-vdel="' + v.id + '" aria-label="Excluir">' + V_TRASH + '</button></td></tr>';
        }).join("");
        body = '<div class="card" style="padding:6px"><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Cliente</th><th>Plano</th><th>Veículo</th><th>Comissão</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
      }
      vendasRoot.innerHTML = cards + body;
      Array.prototype.forEach.call(vendasRoot.querySelectorAll("[data-vedit]"), function (b) { b.addEventListener("click", function () { vForm(vFind(b.getAttribute("data-vedit"))); }); });
      Array.prototype.forEach.call(vendasRoot.querySelectorAll("[data-vdel]"), function (b) { b.addEventListener("click", function () { vDel(vFind(b.getAttribute("data-vdel"))); }); });
    }

    function vForm(v) {
      var editing = !!v; v = v || {};
      var opts = '<option value="">— Cliente avulso / digite abaixo —</option>' + vClientes.map(function (c) { return '<option value="' + c.id + '"' + (v.cliente_id === c.id ? " selected" : "") + '>' + vEsc(c.nome) + '</option>'; }).join("");
      var ov = document.createElement("div"); ov.className = "modal-overlay";
      ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><h3 style="margin:0">' + (editing ? "Editar venda" : "Nova venda") + '</h3>' +
        '<form class="m-form">' +
          '<label class="m-field"><span>Cliente</span><select name="cliente_id">' + opts + '</select></label>' +
          vFieldI("Nome do cliente*", "cliente_nome", v.cliente_nome) +
          '<div class="m-row">' + vFieldI("Plano", "plano", v.plano) + vFieldI("Veículo", "veiculo", v.veiculo) + '</div>' +
          '<div class="m-row">' + vFieldI("Valor (R$)", "valor", v.valor, "number") + vFieldI("Comissão (R$)", "comissao", v.comissao, "number") + '</div>' +
          '<div class="m-row"><label class="m-field"><span>Status</span><select name="status">' + ["ativa", "pendente", "cancelada"].map(function (s) { return '<option value="' + s + '"' + (v.status === s ? " selected" : "") + '>' + V_STATUS[s] + '</option>'; }).join("") + '</select></label>' + vFieldI("Data", "data", (v.data ? String(v.data).slice(0, 10) : new Date().toISOString().slice(0, 10)), "date") + '</div>' +
          '<div class="m-msg" hidden></div>' +
          '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px"><button type="button" class="btn btn-ghost btn-sm" data-cancel>Cancelar</button><button type="submit" class="btn btn-primary btn-sm">' + (editing ? "Salvar" : "Adicionar") + '</button></div>' +
        '</form></div>';
      document.body.appendChild(ov); document.body.classList.add("nav-locked");
      function close() { ov.parentNode && ov.parentNode.removeChild(ov); document.body.classList.remove("nav-locked"); }
      ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
      ov.querySelector("[data-cancel]").addEventListener("click", close);
      var form = ov.querySelector(".m-form");
      var sel = form.querySelector('[name="cliente_id"]'), nameF = form.querySelector('[name="cliente_nome"]');
      sel.addEventListener("change", function () { var c = vClientes.filter(function (x) { return x.id === sel.value; })[0]; if (c) nameF.value = c.nome; });
      function msg(t) { var m = form.querySelector(".m-msg"); m.textContent = t; m.hidden = false; }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var d = {};
        Array.prototype.forEach.call(form.querySelectorAll("[name]"), function (el) { d[el.name] = (el.value || "").trim(); });
        if (!d.cliente_nome) return msg("Informe o nome do cliente.");
        var btn = form.querySelector('[type="submit"]'); btn.disabled = true;
        var p = editing ? TPData.updateVenda(v.id, d) : TPData.addVenda(d);
        p.then(function (res) { btn.disabled = false; if (res && res.ok === false) return msg(res.error || "Não foi possível salvar."); close(); vReload(); }, function () { btn.disabled = false; msg("Erro de conexão. Tente novamente."); });
      });
    }

    function vDel(v) { if (!v) return; if (!window.confirm('Excluir esta venda de "' + v.cliente_nome + '"? Esta ação não pode ser desfeita.')) return; TPData.deleteVenda(v.id).then(vReload); }
    function vReload() {
      vEmpty("Carregando vendas…");
      return Promise.all([TPData.listVendas(), TPData.listClientes()]).then(function (r) { vendas = r[0] || []; vClientes = r[1] || []; vRender(); },
        function () { vEmpty('Não foi possível carregar suas vendas. Se as tabelas ainda não existem no Supabase, rode <code>db/migrations.sql</code> no SQL Editor.'); });
    }
    if (addVendaBtn) addVendaBtn.addEventListener("click", function () { vForm(null); });
    if (window.TPData) { TPData.session().then(function (s) { if (!s) { window.location.href = "login.html"; return; } vReload(); }, function () { vReload(); }); } else { vReload(); }
  }

  // ---- Dashboard: KPIs + vendas recentes + gráfico semanal ----
  var vendasRecentesEl = document.getElementById("vendasRecentes");
  if (vendasRecentesEl && window.TPData && TPData.listVendas) {
    var dSet = function (id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
    TPData.listVendas().then(function (list) {
      var vlist = list || [], now = new Date(), comMes = 0, ativos = 0, qtdMes = 0;
      vlist.forEach(function (v) {
        if (v.status === "ativa") ativos++;
        if (v.status !== "cancelada" && vIsMonth(v.data, now)) { comMes += Number(v.comissao) || 0; qtdMes++; }
      });
      dSet("kpiComissao", vBRL(comMes));
      dSet("kpiVeiculos", String(ativos));
      dSet("realizadoVendas", qtdMes + (qtdMes === 1 ? " venda" : " vendas"));
      if (!vlist.length) {
        vendasRecentesEl.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--tp-muted);padding:28px 12px">Nenhuma venda registrada ainda. <a href="vendas.html">Registrar venda</a>.</td></tr>';
      } else {
        vendasRecentesEl.innerHTML = vlist.slice(0, 6).map(function (v) {
          return '<tr><td style="font-weight:600">' + (vEsc(v.cliente_nome) || "—") + '</td><td>' + (vEsc(v.plano) || "—") + '</td><td>' + (vEsc(v.veiculo) || "—") + '</td><td>' + vBRL(v.comissao) + '</td><td><span class="' + vStatusBadge(v.status) + '">' + (V_STATUS[v.status] || "—") + '</span></td></tr>';
        }).join("");
      }
      var chart = document.getElementById("vendasChart");
      if (chart) {
        var weeks = [0, 0, 0, 0, 0];
        vlist.forEach(function (v) {
          if (v.status === "cancelada" || !vIsMonth(v.data, now)) return;
          var day = parseInt(String(v.data).slice(8, 10), 10) || 1;
          weeks[Math.min(4, Math.floor((day - 1) / 7))]++;
        });
        var max = Math.max.apply(null, weeks.concat([1]));
        chart.innerHTML = weeks.map(function (n, i) {
          return '<div class="bar-col"><div class="bar' + (i === 4 ? " alt" : "") + '" style="height:' + Math.round((n / max) * 100) + '%"></div><span class="bar-lbl">S' + (i + 1) + '</span></div>';
        }).join("");
      }
    }, function () {
      vendasRecentesEl.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--tp-muted);padding:20px 12px">Vendas indisponíveis (rode <code>db/migrations.sql</code> no Supabase).</td></tr>';
    });
  }

  // ---- Certificações: listagem ----
  var certRoot = document.getElementById("certificacoesRoot");
  if (certRoot) {
    var certEmpty = function (msg) { certRoot.innerHTML = '<div class="gestao-empty">' + msg + '</div>'; };
    var certEsc = function (s) { return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
    var certDate = function (s) { if (!s) return "—"; var p = String(s).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : s; };
    function renderCerts(list, nome) {
      if (!list.length) { certEmpty('Você ainda não tem certificados. Conclua um módulo e seja aprovado na prova (≥70%) para liberar o seu. <a href="aula.html">Ir para a trilha</a>.'); return; }
      certRoot.innerHTML = '<div class="cert-list">' + list.map(function (c) {
        return '<div class="cert">' +
          '<div class="seal"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M9 13.8 8 22l4-2.5L16 22l-1-8.2"/></svg></div>' +
          '<div class="eyebrow2">Todos Protegidos University</div>' +
          '<h2>Certificado de Conclusão</h2>' +
          '<p class="desc">Certificamos que</p>' +
          '<div class="name">' + certEsc(nome || "Consultor") + '</div>' +
          '<p class="desc">concluiu com aproveitamento o módulo <strong>' + certEsc(c.modulo_titulo || "—") + '</strong> da formação de consultores de proteção veicular da Todos Protegidos University.</p>' +
          '<div class="foot"><div class="it"><b>' + (Number(c.score) || 0) + '%</b><span>Aproveitamento</span></div><div class="it"><b>' + certDate(c.data) + '</b><span>Data de conclusão</span></div><div class="it"><b>' + certEsc(c.id_validacao || "—") + '</b><span>Código de validação</span></div></div>' +
          '</div>';
      }).join("") + '</div><div class="quiz-print-hide" style="margin-top:20px;text-align:center"><button class="btn btn-ghost btn-sm" id="certPrint">Imprimir / salvar PDF</button></div>';
      var pb = document.getElementById("certPrint"); if (pb) pb.addEventListener("click", function () { window.print(); });
    }
    certEmpty("Carregando certificados…");
    if (window.TPData) {
      TPData.session().then(function (s) {
        if (!s) { window.location.href = "login.html"; return; }
        TPData.listCertificates().then(function (list) { renderCerts(list || [], s.nome); },
          function () { certEmpty('Não foi possível carregar seus certificados. Se a tabela ainda não existe no Supabase, rode <code>db/migrations.sql</code> no SQL Editor.'); });
      }, function () { certEmpty("Sessão indisponível."); });
    }
  }

  // ---- Ranking & metas ----
  var rankingRoot = document.getElementById("rankingRoot");
  if (rankingRoot) {
    var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    var rNow = new Date(), rMes = rNow.getMonth() + 1, rAno = rNow.getFullYear();
    var rMeta = null, rSess = null;
    function rEmpty(m) { rankingRoot.innerHTML = '<div class="gestao-empty">' + m + '</div>'; }
    function rBar(atual, meta) { var p = meta > 0 ? Math.min(100, Math.round(atual / meta * 100)) : 0; return '<div class="progress" style="margin-top:8px"><i style="width:' + p + '%"></i></div>'; }
    function rRender(meta, ranking, vendas) {
      rMeta = meta;
      var tv = 0, tc = 0;
      (vendas || []).forEach(function (v) { if (v.status === "cancelada") return; if (vIsMonth(v.data, rNow)) { tv++; tc += Number(v.comissao) || 0; } });
      var mv = (meta && meta.meta_vendas) || 0, mc = (meta && meta.meta_comissao) || 0;
      var desempenho = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><h3 style="margin:0">Seu desempenho · ' + MESES[rMes - 1] + ' de ' + rAno + '</h3><button class="btn btn-ghost btn-sm" id="editMeta">' + (meta ? "Editar meta" : "Definir meta") + '</button></div><div class="r-metrics">' +
        '<div><div class="lbl muted" style="font-size:var(--tp-fs-xs)">Vendas</div><strong style="font-family:var(--tp-font-sans);font-size:var(--tp-fs-xl)">' + tv + (mv ? ' <span class="muted" style="font-weight:400;font-size:var(--tp-fs-sm)">/ ' + mv + '</span>' : '') + '</strong>' + rBar(tv, mv) + '</div>' +
        '<div><div class="lbl muted" style="font-size:var(--tp-fs-xs)">Comissão</div><strong style="font-family:var(--tp-font-sans);font-size:var(--tp-fs-xl)">' + vBRL(tc) + (mc ? ' <span class="muted" style="font-weight:400;font-size:var(--tp-fs-sm)">/ ' + vBRL(mc) + '</span>' : '') + '</strong>' + rBar(tc, mc) + '</div>' +
        '</div></div>';
      var tableCard;
      if (!ranking || !ranking.length) {
        tableCard = '<div class="panel" style="margin-top:24px"><div class="panel-head"><h3>Ranking do mês</h3></div><div class="gestao-empty">O ranking aparece quando houver vendas registradas no mês.</div></div>';
      } else {
        var rows = ranking.map(function (r, i) {
          var me = rSess && r.nome && rSess.nome && r.nome.toLowerCase() === rSess.nome.toLowerCase();
          return '<tr' + (me ? ' style="background:var(--tp-green-50)"' : '') + '><td style="font-weight:700;color:var(--tp-green-700)">' + (i + 1) + 'º</td><td style="font-weight:600">' + vEsc(r.nome) + (me ? ' <span class="badge badge-blue">você</span>' : '') + '</td><td>' + (r.total_vendas || 0) + '</td><td>' + vBRL(r.total_comissao || 0) + '</td></tr>';
        }).join("");
        tableCard = '<div class="card" style="margin-top:24px;padding:6px"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Consultor</th><th>Vendas</th><th>Comissão</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
      }
      rankingRoot.innerHTML = desempenho + tableCard;
      var em = document.getElementById("editMeta"); if (em) em.addEventListener("click", rOpenMeta);
    }
    function rOpenMeta() {
      var ov = document.createElement("div"); ov.className = "modal-overlay";
      var mv = (rMeta && rMeta.meta_vendas) || "", mc = (rMeta && rMeta.meta_comissao) || "";
      ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><h3 style="margin:0">Meta de ' + MESES[rMes - 1] + '</h3><form class="m-form">' +
        '<label class="m-field"><span>Meta de vendas</span><input name="meta_vendas" type="number" min="0" value="' + mv + '"></label>' +
        '<label class="m-field"><span>Meta de comissão (R$)</span><input name="meta_comissao" type="number" min="0" step="0.01" value="' + mc + '"></label>' +
        '<div class="m-msg" hidden></div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px"><button type="button" class="btn btn-ghost btn-sm" data-cancel>Cancelar</button><button type="submit" class="btn btn-primary btn-sm">Salvar meta</button></div></form></div>';
      document.body.appendChild(ov); document.body.classList.add("nav-locked");
      function close() { ov.parentNode && ov.parentNode.removeChild(ov); document.body.classList.remove("nav-locked"); }
      ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
      ov.querySelector("[data-cancel]").addEventListener("click", close);
      ov.querySelector(".m-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var f = e.target, btn = f.querySelector('[type="submit"]'); btn.disabled = true;
        TPData.setMeta(rMes, rAno, { meta_vendas: f.meta_vendas.value, meta_comissao: f.meta_comissao.value }).then(function (res) {
          btn.disabled = false; if (res && res.ok === false) { var m = f.querySelector(".m-msg"); m.textContent = res.error || "Erro ao salvar."; m.hidden = false; return; } close(); rLoad();
        }, function () { btn.disabled = false; var m = f.querySelector(".m-msg"); m.textContent = "Erro de conexão."; m.hidden = false; });
      });
    }
    function rLoad() {
      rEmpty("Carregando ranking…");
      Promise.all([TPData.getMeta(rMes, rAno), TPData.getRanking(rMes, rAno), TPData.listVendas()]).then(function (r) { rRender(r[0], r[1] || [], r[2] || []); },
        function () { rEmpty('Não foi possível carregar o ranking. Se as tabelas/função ainda não existem no Supabase, rode <code>db/migrations.sql</code> no SQL Editor.'); });
    }
    if (window.TPData) { TPData.session().then(function (s) { if (!s) { window.location.href = "login.html"; return; } rSess = s; rLoad(); }, function () { rLoad(); }); }
  }

  // ---- Dashboard: painel de ranking + meta do mês ----
  var dashRankingEl = document.getElementById("dashRanking");
  if (dashRankingEl && window.TPData && TPData.getRanking) {
    var dNow = new Date(), dMes = dNow.getMonth() + 1, dAno = dNow.getFullYear();
    TPData.getRanking(dMes, dAno).then(function (list) {
      if (!list || !list.length) { dashRankingEl.innerHTML = "O ranking aparece quando houver vendas registradas no seu grupo."; return; }
      dashRankingEl.className = ""; dashRankingEl.removeAttribute("style");
      dashRankingEl.innerHTML = '<div class="rank-mini">' + list.slice(0, 5).map(function (r, i) {
        return '<div class="rank-row"><span class="rank-pos">' + (i + 1) + 'º</span><span class="rank-nm">' + vEsc(r.nome) + '</span><span class="rank-val">' + vBRL(r.total_comissao || 0) + '</span></div>';
      }).join("") + '</div>';
    }, function () {});
    TPData.getMeta(dMes, dAno).then(function (m) { var el = document.getElementById("metaMes"); if (el && m && m.meta_vendas) el.textContent = m.meta_vendas + " vendas"; });
  }

  // ---- Reflete a sessão (nome/perfil) e injeta o botão "Sair" ----
  (function () {
    var chip = document.querySelector(".user-chip");
    if (!chip) return;
    chip.style.marginLeft = "auto";
    chip.style.cursor = "pointer";
    chip.title = "Editar minha conta";
    chip.addEventListener("click", function () { window.location.href = "conta.html"; });
    function apply(s) {
      if (!s || !s.nome) return;
      var nm = chip.querySelector(".nm"); if (nm) nm.textContent = s.nome;
      var rl = chip.querySelector(".rl"); if (rl) rl.textContent = papelLabel(s);
      var av = chip.querySelector(".avatar");
      if (av) av.textContent = s.nome.split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join("").toUpperCase();
    }
    if (window.TPData) TPData.session().then(apply, function () {});
    if (!chip.parentNode.querySelector("[data-logout]")) {
      var out = document.createElement("button");
      out.className = "btn btn-ghost btn-sm";
      out.setAttribute("data-logout", "");
      out.style.marginLeft = "12px";
      out.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>Sair';
      out.addEventListener("click", logout);
      chip.parentNode.appendChild(out);
    }
  })();

  // Rolagem suave já é via CSS; aqui animamos as barras do dashboard ao carregar
  window.addEventListener("load", function () {
    document.querySelectorAll(".chart .bar").forEach(function (bar, i) {
      var h = bar.style.height;
      bar.style.height = "0%";
      setTimeout(function () { bar.style.height = h; }, 120 + i * 90);
    });
    document.querySelectorAll(".progress > i").forEach(function (fill) {
      var w = fill.style.width;
      fill.style.width = "0%";
      setTimeout(function () { fill.style.width = w; }, 200);
    });
  });
})();
