// Todos Protegidos — componente único de navegação (sidebar + topbar + drawer mobile).
// Fonte de verdade do menu para TODAS as páginas internas. Carregado ANTES de app.js
// (assim a injeção do user-chip/Sair em app.js encontra o .user-chip recém-criado).
(function () {
  "use strict";

  // SVGs reaproveitados das páginas atuais (mesmos paths) — só o conteúdo do <svg>.
  var ICON = {
    grid:   '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    book:   '<path d="M4 19.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13.5"/><path d="M4 19.5 12 16l8 3.5"/><path d="M9 8h6M9 12h6"/>',
    dollar: '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    users:  '<circle cx="9" cy="7" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/>',
    file:   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/>',
    chat:   '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/><path d="M8 9h8M8 13h5"/>',
    edit:   '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M6 3h12v6a6 6 0 0 1-12 0Z"/><path d="M9 21h6M12 17v4"/>',
    medal:  '<circle cx="12" cy="8" r="6"/><path d="M9 13.8 8 22l4-2.5L16 22l-1-8.2"/>',
    gear:   '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 13.6H4a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 5 6.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10.4 4h.2a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 18 5.6l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8Z"/>',
    flag:   '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z"/><path d="M4 22V4"/>',
    life:   '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.9 4.9 4.2 4.2M14.9 14.9l4.2 4.2M14.9 9.1l4.2-4.2M9.1 14.9l-4.2 4.2"/>',
    bolt:   '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>',
    menu:   '<path d="M4 7h16M4 12h16M4 17h16"/>'
  };
  function icon(name, size) {
    size = size || 20;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICON[name] || "") + '</svg>';
  }

  // ---- Fonte única do menu --------------------------------------------------
  // state:"soon" = funcionalidade ainda não construída (vira link real quando a
  //               feature correspondente for entregue).
  // roles       = item visível só para esses papéis (oculto até a sessão confirmar).
  // match       = arquivos que ativam o item (resolve aliases, ex.: quiz -> Trilha).
  var NAV = [
    { section: null, items: [
      { id: "institucional", label: "Institucional",      href: "institucional.html",    icon: "flag",   match: ["institucional.html"] },
      { id: "dashboard", label: "Visão geral",          href: "dashboard.html",        icon: "grid",   match: ["dashboard.html", ""] },
      { id: "trilha",    label: "Trilha de treinamento", href: "aula.html",             icon: "book",   match: ["aula.html", "aula-abordagem.html", "quiz.html"] },
      { id: "vendas",    label: "Minhas vendas",         href: "vendas.html",           icon: "dollar", match: ["vendas.html"] },
      { id: "clientes",  label: "Meus clientes",         href: "clientes.html",         icon: "users",  match: ["clientes.html"] }
    ] },
    { section: "Operação", items: [
      { id: "protocolos", label: "Padrões & protocolos", href: "protocolos.html", icon: "file", match: ["protocolos.html"] },
      { id: "scripts",    label: "Biblioteca de scripts", href: "scripts.html",   icon: "chat", match: ["scripts.html"] },
      { id: "manual",     label: "Manual do consultor",   href: "manual.html",    icon: "life", match: ["manual.html"] },
      { id: "operacao",   label: "Operação (CRM)",        href: "operacao.html",  icon: "bolt", match: ["operacao.html"], roles: ["admin", "superadmin"] },
      { id: "gestao",     label: "Gestão de conteúdo",    href: "gestao.html",    icon: "edit", match: ["gestao.html", "prova.html"], roles: ["admin", "superadmin"] },
      { id: "equipe",     label: "Progresso da equipe",   href: "equipe.html",    icon: "users", match: ["equipe.html"], roles: ["admin", "superadmin"] }
    ] },
    { section: "Carreira", items: [
      { id: "ranking", label: "Ranking & metas", href: "ranking.html",            icon: "trophy", match: ["ranking.html"] },
      { id: "cert",    label: "Certificações",   href: "certificacoes.html",     icon: "medal",  match: ["certificacoes.html"] },
      { id: "conta",   label: "Minha conta",     href: "conta.html",             icon: "gear",   match: ["conta.html"] }
    ] }
  ];

  function currentFile() {
    return (location.pathname.split("/").pop() || "index.html").toLowerCase();
  }
  function isActive(item, explicit) {
    if (explicit) return item.id === explicit;
    var f = currentFile();
    var list = item.match || [(item.href.split("#")[0]).toLowerCase()];
    for (var i = 0; i < list.length; i++) { if (list[i].toLowerCase() === f) return true; }
    return false;
  }

  // ---- Drawer mobile --------------------------------------------------------
  function overlay() {
    var ov = document.querySelector(".nav-overlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.className = "nav-overlay";
      document.body.appendChild(ov);
      ov.addEventListener("click", closeDrawer);
    }
    return ov;
  }
  function openDrawer() {
    var sb = document.getElementById("sidebar-root"); if (!sb) return;
    sb.classList.add("open"); overlay().classList.add("open");
    document.body.classList.add("nav-locked");
    var b = document.querySelector(".nav-burger"); if (b) b.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    var sb = document.getElementById("sidebar-root"); if (sb) sb.classList.remove("open");
    var ov = document.querySelector(".nav-overlay"); if (ov) ov.classList.remove("open");
    document.body.classList.remove("nav-locked");
    var b = document.querySelector(".nav-burger"); if (b) b.setAttribute("aria-expanded", "false");
  }
  function toggleDrawer() {
    var sb = document.getElementById("sidebar-root"); if (!sb) return;
    if (sb.classList.contains("open")) closeDrawer(); else openDrawer();
  }

  // ---- Sidebar --------------------------------------------------------------
  function buildSidebar(root) {
    var explicit = root.getAttribute("data-active");
    var html = '<div class="sidebar-brand"><a class="brand" href="dashboard.html"><img src="assets/img/logo.svg" alt="Todos Protegidos"></a></div>';
    NAV.forEach(function (group) {
      if (group.section) html += '<div class="side-label">' + group.section + '</div>';
      group.items.forEach(function (item) {
        var soon = item.state === "soon";
        var cls = "side-link";
        if (isActive(item, explicit)) cls += " active";
        if (soon) cls += " is-soon";
        if (item.roles) cls += " role-hidden";
        var attrs = ' data-nav="' + item.id + '"';
        if (item.roles) attrs += ' data-roles="' + item.roles.join(",") + '"';
        if (soon) attrs += ' aria-disabled="true" tabindex="-1"';
        var badge = soon ? '<span class="side-badge soon">Em breve</span>' : '';
        html += '<a class="' + cls + '" href="' + (soon ? "#" : item.href) + '"' + attrs + '>' +
                icon(item.icon) + '<span>' + item.label + '</span>' + badge + '</a>';
      });
    });
    html += '<div class="side-foot"><div class="side-card">' +
              '<div class="lbl">Seu nível</div>' +
              '<div id="sideLevel" class="side-card-val">Novato</div>' +
              '<div class="progress side-progress"><i id="sideProg" style="width:0%"></i></div>' +
              '<div class="lbl" id="sideHint" style="margin-top:8px">Comece sua trilha para evoluir</div>' +
            '</div></div>';
    html += '<div class="side-credit"><span class="drap-credit">Desenvolvido por <img src="assets/img/drap-logo.svg" alt="DRAP"></span></div>';
    root.innerHTML = html;

    Array.prototype.forEach.call(root.querySelectorAll(".side-link.is-soon"), function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); });
    });
    Array.prototype.forEach.call(root.querySelectorAll(".side-link:not(.is-soon)"), function (a) {
      a.addEventListener("click", closeDrawer);
    });
  }

  // ---- Topbar ---------------------------------------------------------------
  function buildTopbar(root) {
    var title = root.getAttribute("data-title") || "";
    var sub = root.getAttribute("data-sub") || "";
    var search = root.getAttribute("data-search"); // null = sem busca
    var html = '<button class="nav-burger" type="button" aria-label="Abrir menu" aria-expanded="false">' + icon("menu", 24) + '</button>';
    html += '<div class="topbar-titles"><h1>' + title + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>';
    if (search !== null) {
      html += '<label class="search">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#80948b" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
                '<input type="search" placeholder="' + (search || "Buscar...") + '">' +
              '</label>';
    }
    html += '<div class="user-chip"><div class="avatar">TP</div>' +
              '<div><div class="nm">Consultor</div><div class="rl"></div></div>' +
            '</div>';
    root.innerHTML = html;
    var burger = root.querySelector(".nav-burger");
    if (burger) burger.addEventListener("click", toggleDrawer);
    wireSearch(root);
  }

  // ---- Busca global (módulos + aulas) --------------------------------------
  var searchIndex = null;
  function norm(s) {
    s = (s || "").toLowerCase();
    return s.normalize ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : s;
  }
  function tipoLabel(t) { return t === "video" ? "Vídeo" : t === "quiz" ? "Prova" : t === "texto" ? "Material" : "Aula"; }
  function tipoIcon(t) { return t === "quiz" ? "medal" : t === "video" ? "book" : "file"; }
  function loadIndex() {
    if (searchIndex) return Promise.resolve(searchIndex);
    if (!(window.TPData && TPData.listModules)) { searchIndex = []; return Promise.resolve(searchIndex); }
    return TPData.listModules().then(function (mods) {
      var idx = [];
      (mods || []).forEach(function (m) {
        idx.push({ type: "Módulo", label: m.titulo, sub: m.sub || "", href: "aula.html", icon: "book" });
        (m.itens || []).forEach(function (it) {
          idx.push({ type: tipoLabel(it.tipo), label: it.titulo, sub: m.titulo, href: "aula.html?item=" + encodeURIComponent(it.id), icon: tipoIcon(it.tipo) });
        });
      });
      searchIndex = idx; return idx;
    }, function () { searchIndex = []; return searchIndex; });
  }
  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function wireSearch(scope) {
    var label = scope.querySelector(".search");
    if (!label) return;
    var input = label.querySelector("input");
    if (!input) return;
    input.setAttribute("autocomplete", "off");
    var box = document.createElement("div");
    box.className = "search-results";
    box.setAttribute("hidden", "");
    label.appendChild(box);
    var timer;
    function close() { box.setAttribute("hidden", ""); box.innerHTML = ""; }
    function run() {
      var q = norm(input.value.trim());
      if (q.length < 2) { close(); return; }
      loadIndex().then(function (idx) {
        var hits = [];
        for (var i = 0; i < idx.length && hits.length < 8; i++) {
          if (norm(idx[i].label).indexOf(q) !== -1 || norm(idx[i].sub).indexOf(q) !== -1) hits.push(idx[i]);
        }
        if (!hits.length) {
          box.innerHTML = '<div class="search-empty">Nada encontrado para “' + esc(input.value.trim()) + '”.</div>';
        } else {
          box.innerHTML = hits.map(function (h) {
            return '<a class="search-item" href="' + h.href + '">' + icon(h.icon, 16) +
                   '<span class="si-main"><span class="si-label">' + esc(h.label) + '</span>' +
                   '<span class="si-sub">' + esc(h.type) + (h.sub ? " · " + esc(h.sub) : "") + '</span></span></a>';
          }).join("");
        }
        box.removeAttribute("hidden");
      });
    }
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 160); });
    input.addEventListener("focus", run);
    input.addEventListener("keydown", function (e) { if (e.key === "Escape" || e.keyCode === 27) { close(); input.blur(); } });
    document.addEventListener("click", function (e) { if (!label.contains(e.target)) close(); });
  }

  // ---- Gate por papel (mostra "Gestão de conteúdo" só p/ admin) -------------
  function applyRoles() {
    if (!(window.TPData && TPData.session)) return;
    TPData.session().then(function (s) {
      var role = s && s.role;
      Array.prototype.forEach.call(document.querySelectorAll(".side-link[data-roles]"), function (a) {
        var roles = (a.getAttribute("data-roles") || "").split(",");
        if (role && roles.indexOf(role) !== -1) a.classList.remove("role-hidden");
      });
    }, function () {});
  }

  // ---- Init -----------------------------------------------------------------
  var sbRoot = document.getElementById("sidebar-root");
  var tbRoot = document.getElementById("topbar-root");
  if (tbRoot) buildTopbar(tbRoot);
  if (sbRoot) { buildSidebar(sbRoot); applyRoles(); }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.keyCode === 27) closeDrawer();
  });

  window.TPNav = { open: openDrawer, close: closeDrawer, NAV: NAV };
})();
