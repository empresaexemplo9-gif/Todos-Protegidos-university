// Componente único de navegação (sidebar + topbar + drawer mobile).
// Fonte de verdade do menu para TODAS as páginas internas. Carregado ANTES de app.js
// (assim a injeção do user-chip/Sair em app.js encontra o .user-chip recém-criado).
(function () {
  "use strict";

  // SVGs de ícone (só o conteúdo do <svg>).
  var ICON = {
    grid: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 13.6H4a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 5 6.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10.4 4h.2a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 18 5.6l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>'
  };
  function icon(name, size) {
    size = size || 20;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICON[name] || "") + '</svg>';
  }

  // ---- Fonte única do menu --------------------------------------------------
  // roles = item visível só para esses papéis (oculto até a sessão confirmar).
  // match = arquivos que ativam o item.
  var NAV = [
    { section: null, items: [
      { id: "propostas", label: "Propostas", href: "propostas.html", icon: "file", match: ["propostas.html", "proposta.html", "proposta-view.html"] },
      { id: "dashboard", label: "Visão geral", href: "dashboard.html", icon: "grid", match: ["dashboard.html"] },
      { id: "gestao",    label: "Gestão de conteúdo", href: "gestao.html", icon: "edit", match: ["gestao.html"], roles: ["admin", "superadmin"] },
      { id: "conta",     label: "Minha conta", href: "conta.html", icon: "gear", match: ["conta.html"] }
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
    var html = '<div class="sidebar-brand"><a class="brand" href="propostas.html"><img src="assets/img/logo-light.svg" alt="Sona"></a></div>';
    NAV.forEach(function (group) {
      if (group.section) html += '<div class="side-label">' + group.section + '</div>';
      group.items.forEach(function (item) {
        var cls = "side-link";
        if (isActive(item, explicit)) cls += " active";
        if (item.roles) cls += " role-hidden";
        var attrs = ' data-nav="' + item.id + '"';
        if (item.roles) attrs += ' data-roles="' + item.roles.join(",") + '"';
        html += '<a class="' + cls + '" href="' + item.href + '"' + attrs + '>' +
                icon(item.icon) + '<span>' + item.label + '</span></a>';
      });
    });
    root.innerHTML = html;

    Array.prototype.forEach.call(root.querySelectorAll(".side-link"), function (a) {
      a.addEventListener("click", closeDrawer);
    });
  }

  // ---- Topbar ---------------------------------------------------------------
  function buildTopbar(root) {
    var title = root.getAttribute("data-title") || "";
    var sub = root.getAttribute("data-sub") || "";
    var html = '<button class="nav-burger" type="button" aria-label="Abrir menu" aria-expanded="false">' + icon("menu", 24) + '</button>';
    html += '<div class="topbar-titles"><h1>' + title + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>';
    html += '<div class="user-chip"><div class="avatar">•</div>' +
              '<div><div class="nm">Usuário</div><div class="rl"></div></div>' +
            '</div>';
    root.innerHTML = html;
    var burger = root.querySelector(".nav-burger");
    if (burger) burger.addEventListener("click", toggleDrawer);
  }

  // ---- Gate por papel (mostra itens restritos só p/ admin) ------------------
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
