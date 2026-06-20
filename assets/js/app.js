// Todos Protegidos — interações leves da interface
(function () {
  "use strict";

  // Sessão / logout (via camada de dados TPData — Supabase ou local)
  function logout() {
    var done = function () { try { localStorage.removeItem("tp_sessao"); } catch (e) {} window.location.href = "login.html"; };
    if (window.TPData) { TPData.logout().then(done, done); } else { done(); }
  }

  // Menu mobile (landing)
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("nav-open");
      links.style.display = open ? "flex" : "";
      links.style.flexDirection = "column";
      links.style.position = "absolute";
      links.style.top = "74px";
      links.style.left = "0";
      links.style.right = "0";
      links.style.background = "#fff";
      links.style.padding = open ? "16px 24px" : "";
      links.style.borderBottom = open ? "1px solid var(--tp-line)" : "";
      links.style.gap = "8px";
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

  // ---- Player de aula: abas ----
  var tabs = document.querySelectorAll(".tab[data-tab]");
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-tab");
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        document.querySelectorAll(".tab-panel").forEach(function (p) {
          p.classList.toggle("active", p.getAttribute("data-panel") === name);
        });
      });
    });
  }

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
            '<button class="lvl-del" title="Excluir módulo" aria-label="Excluir módulo">' + DEL + '</button>' +
            CHEV +
          '</div>' +
        '</div>'
      );
      head.querySelector("h3").textContent = mod.titulo;
      head.querySelector(".lvl-info .d").textContent = mod.sub || "";
      head.addEventListener("click", function (e) {
        if (e.target.closest(".lvl-del")) return;
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
      html += '<p class="muted">' + (sel.item.desc ? esc(sel.item.desc) : (sel.item.meta ? esc(sel.item.meta) : "—")) + '</p>';
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
      });
      html += '<a class="lesson" href="quiz.html" style="text-decoration:none;color:inherit"><span class="ic next">★</span><div class="t">Avaliação do módulo<small>Quiz · libera certificado</small></div></a>';
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

  // ---- Avaliação / quiz + certificado ----
  var quizForm = document.getElementById("quizForm");
  if (quizForm) {
    var questions = quizForm.querySelectorAll("[data-q]");
    var total = questions.length;
    var PASS = 0.7;
    var answeredEl = document.getElementById("answered");
    var barEl = document.getElementById("quizBar");

    function updateProgress() {
      var done = 0;
      questions.forEach(function (q) { if (q.querySelector("input:checked")) done++; });
      if (answeredEl) answeredEl.textContent = done;
      if (barEl) barEl.style.width = Math.round((done / total) * 100) + "%";
    }
    quizForm.addEventListener("change", function (e) { if (e.target && e.target.type === "radio") updateProgress(); });

    quizForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var correct = 0;
      questions.forEach(function (q) {
        var chosen = q.querySelector("input:checked");
        q.classList.add("graded");
        var right = q.querySelector("input[data-correct]");
        // marca a opção correta
        var rightOpt = right.closest(".opt");
        rightOpt.classList.add("correct");
        if (!rightOpt.querySelector(".res")) {
          var s = document.createElement("span"); s.className = "res"; s.textContent = "✓ correta"; rightOpt.appendChild(s);
        }
        if (chosen) {
          if (chosen.hasAttribute("data-correct")) {
            correct++;
          } else {
            var wrongOpt = chosen.closest(".opt");
            wrongOpt.classList.add("wrong");
            var w = document.createElement("span"); w.className = "res"; w.textContent = "✗ sua resposta"; wrongOpt.appendChild(w);
          }
        }
        // bloqueia alterações
        q.querySelectorAll("input").forEach(function (i) { i.disabled = true; });
      });

      var pct = Math.round((correct / total) * 100);
      var passed = correct / total >= PASS;

      var result = document.getElementById("quizResult");
      document.getElementById("quizScore").textContent = pct + "%";
      document.getElementById("quizMsg").textContent = passed ? "Parabéns, você foi aprovado! 🎉" : "Quase lá — não foi dessa vez.";
      document.getElementById("quizSub").textContent = "Você acertou " + correct + " de " + total + " questões." + (passed ? " Seu certificado foi liberado abaixo." : " A nota mínima é 70% (5 de 7). Revise o conteúdo e tente novamente.");
      result.className = "quiz-result quiz-print-hide show " + (passed ? "pass" : "fail");

      document.getElementById("quizSubmit").style.display = "none";
      document.getElementById("quizReset").style.display = "";

      if (passed) {
        var cw = document.getElementById("certWrap");
        cw.classList.add("show");
        document.getElementById("certScore").textContent = pct + "%";
        var d = new Date();
        document.getElementById("certDate").textContent = d.toLocaleDateString("pt-BR");
        document.getElementById("certId").textContent = "TP-" + d.getFullYear() + "-" + String(Date.now()).slice(-6);
        cw.scrollIntoView({ behavior: "smooth" });
      } else {
        result.scrollIntoView({ behavior: "smooth" });
      }
    });

    var resetBtn = document.getElementById("quizReset");
    if (resetBtn) resetBtn.addEventListener("click", function () { location.reload(); });

    updateProgress();
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
    Array.prototype.forEach.call(document.querySelectorAll("[data-logout]"), function (b) { b.addEventListener("click", logout); });

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
      var papel = s.role === "admin" ? "Administrador" : s.role === "superadmin" ? "Superadmin" : "Consultor";
      if (p) p.textContent = papel + " · atualize seus dados pessoais e sua senha.";
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
      var rl = chip.querySelector(".rl"); if (rl) rl.textContent = s.role === "admin" ? "Administrador" : "Consultor";
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
