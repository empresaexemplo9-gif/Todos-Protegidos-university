// Interações leves da interface (auth, dashboard, gestão de conteúdo, conta).
(function () {
  "use strict";

  // ---- PWA: service worker + botão "Instalar app" (Android/Chrome) ----
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  (function () {
    var deferred = null;
    function showInstall() {
      if (document.getElementById("tpInstall") || !document.body) return;
      var b = document.createElement("button");
      b.id = "tpInstall"; b.type = "button"; b.textContent = "📲 Instalar app";
      b.setAttribute("style", "position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:9999;border:0;cursor:pointer;background:#2536cf;color:#fff;font:600 14px/1 Inter,system-ui,sans-serif;padding:13px 20px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.28)");
      b.addEventListener("click", function () {
        if (!deferred) return;
        deferred.prompt();
        deferred.userChoice.then(function () {}).catch(function () {}).then(function () { deferred = null; b.parentNode && b.parentNode.removeChild(b); });
      });
      document.body.appendChild(b);
    }
    window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; showInstall(); });
    window.addEventListener("appinstalled", function () { var b = document.getElementById("tpInstall"); if (b && b.parentNode) b.parentNode.removeChild(b); deferred = null; });

    // iOS (Safari): não existe prompt automático — mostra a instrução de instalação.
    function isStandalone() { return window.navigator.standalone === true || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches); }
    function iosHint() {
      var ua = navigator.userAgent || "";
      var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (!isIOS || isStandalone() || !document.body || document.getElementById("tpIosHint")) return;
      try { if (localStorage.getItem("tp_ios_hint") === "1") return; } catch (e) {}
      var d = document.createElement("div"); d.id = "tpIosHint";
      d.setAttribute("style", "position:fixed;left:12px;right:12px;bottom:14px;z-index:9999;background:#2536cf;color:#fff;font:500 13px/1.45 Inter,system-ui,sans-serif;padding:12px 14px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.28);display:flex;align-items:center;gap:10px");
      d.innerHTML = '<span style="font-size:18px">📲</span><span style="flex:1">Para instalar no iPhone: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</span><button type="button" aria-label="Fechar" style="background:transparent;border:0;color:#fff;font-size:20px;line-height:1;cursor:pointer">&times;</button>';
      d.querySelector("button").addEventListener("click", function () { try { localStorage.setItem("tp_ios_hint", "1"); } catch (e) {} if (d.parentNode) d.parentNode.removeChild(d); });
      document.body.appendChild(d);
    }
    if (document.readyState !== "loading") iosHint(); else window.addEventListener("DOMContentLoaded", iosHint);
  })();

  // Sessão / logout (via camada de dados TPData — Supabase ou local).
  // Papel guardado no navegador só para decidir a home instantaneamente;
  // quem manda é a sessão real e o RLS do banco.
  function lembrarPapel(role) {
    try { if (role) localStorage.setItem("tp_papel", role); else localStorage.removeItem("tp_papel"); } catch (e) {}
  }
  window.TPLembrarPapel = lembrarPapel;

  function logout() {
    var done = function () { try { localStorage.removeItem("tp_sessao"); } catch (e) {} lembrarPapel(null); window.location.href = "index.html"; };
    if (window.TPData) { TPData.logout().then(done, done); } else { done(); }
  }

  // Rótulo de papel exibido na interface.
  function papelLabel(s) {
    if (!s) return "";
    if (s.titulo) return s.titulo;
    if (s.role === "superadmin") return "Superadmin";
    if (s.role === "admin") return "Administrador";
    return "Usuário";
  }

  // Liga botões "Sair" estáticos (páginas sem topbar).
  Array.prototype.forEach.call(document.querySelectorAll("[data-logout]"), function (b) { b.addEventListener("click", logout); });

  // Guarda de sessão das páginas internas (body.dash): sem sessão -> login.
  if (document.body && document.body.classList.contains("dash") && window.TPData) {
    var sessionGuard = function () {
      TPData.session().then(function (s) {
        if (!s) { lembrarPapel(null); window.location.replace("login.html"); return; }
        lembrarPapel(s.role || "usuario");
      }, function () {});
    };
    sessionGuard();
    window.addEventListener("pageshow", function (e) { if (e.persisted) sessionGuard(); });
  }

  // Menu mobile (landing) — alterna só a classe; o visual fica no CSS.
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---- Gestão de conteúdo: módulos, itens e materiais (Supabase/local) ----
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
    var LABELS = { video: "Vídeo", aula: "Conteúdo", info: "Informação", file: "Material" };
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
          '<button class="btn btn-ghost btn-sm" data-add="aula">+ Conteúdo</button>' +
          '<button class="btn btn-ghost btn-sm" data-add="video">+ Vídeo</button>' +
          '<button class="btn btn-ghost btn-sm" data-add="info">+ Informação</button>' +
          '<button class="btn btn-ghost btn-sm" data-add="file">+ Material</button>' +
        '</div>'
      );
      body.appendChild(toolbar);

      var form = elt(
        '<form class="add-form">' +
          '<div class="field"><label data-label>Título</label><input class="input" data-f="title" placeholder="Ex.: Item 1" required></div>' +
          '<div class="field-row">' +
            '<div class="field" data-url><label>URL do vídeo</label><input class="input" data-f="url" placeholder="https://..."></div>' +
            '<div class="field"><label>Duração / referência</label><input class="input" data-f="meta" placeholder="Ex.: 10:00"></div>' +
          '</div>' +
          '<div class="field" data-file><label>Enviar arquivo de vídeo</label><input class="input" type="file" accept="video/*" data-f="arquivo"><span class="hint" style="display:block;font-size:var(--tp-fs-xs);color:var(--tp-muted);margin-top:5px">Faça upload do arquivo de vídeo ou cole a URL acima. (Upload disponível no modo nuvem.)</span></div>' +
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
          typeLabel.textContent = "Título d" + (current === "info" ? "a informação" : current === "file" ? "o material" : current === "aula" ? "o conteúdo" : "o vídeo");
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
      if (TPData.configured && TPData.configured()) { resetBtn.style.display = "none"; }
      else resetBtn.addEventListener("click", function () {
        if (confirm("Limpar o conteúdo salvo neste navegador?")) {
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
          '<p style="max-width:42ch;margin:0 auto 18px">Esta área é exclusiva para <strong>administradores</strong>. Faça login com uma conta de administrador para gerenciar o conteúdo.</p>' +
          '<a href="login.html" class="btn btn-primary btn-sm">Entrar como administrador</a>' +
        '</div>';
    }

    // Carrega após checar a sessão (somente admin/superadmin).
    gestaoRoot.innerHTML = '<div class="gestao-empty">Carregando…</div>';
    TPData.session().then(function (sess) {
      if (!(sess && (sess.role === "admin" || sess.role === "superadmin"))) { restrito(); return; }
      reload();
    }, function () { restrito(); });
  }

  // ---- Cadastro (criar o próprio acesso) ----
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

      lembrarPapel("usuario");

      var btn = cadastroForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      TPData.register({ nome: nome, email: email, telefone: telefone, senha: senha, tenant: empresa }).then(function (r) {
        if (!r.ok) { btn.disabled = false; return showMsg(r.error || "Não foi possível criar o acesso.", false); }
        if (r.needsConfirm) {
          showMsg("Acesso criado! Confirme o e-mail enviado e depois faça login.", true);
          return setTimeout(function () { window.location.href = "login.html"; }, 2400);
        }
        showMsg("Acesso criado com sucesso! Redirecionando…", true);
        setTimeout(function () { window.location.href = "propostas.html"; }, 1400);
      }, function () { btn.disabled = false; showMsg("Erro de conexão. Tente novamente.", false); });
    });
  }

  // ---- Login ----
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
        lembrarPapel((r.session && r.session.role) || "usuario");
        lShow("Acesso liberado" + (nome ? ", " + nome.split(" ")[0] : "") + "! Redirecionando…", true);
        setTimeout(function () { window.location.href = "propostas.html"; }, 1000);
      }, function () { btn.disabled = false; lShow("Erro de conexão. Tente novamente.", false); });
    });
  }

  // ---- Cabeçalho de perfil (nome + foto) ----
  var perfilHeader = document.getElementById("perfilHeader");
  if (perfilHeader && window.TPData) {
    var pesc = function (s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
    TPData.session().then(function (s) {
      s = s || {};
      var nome = s.nome || "Usuário";
      var papel = papelLabel(s);
      var fotoKey = "tp_foto_" + (s.email || "");
      var foto = ""; try { foto = localStorage.getItem(fotoKey) || ""; } catch (e) {}
      var iniciais = nome.trim().split(/\s+/).map(function (w) { return w.charAt(0) || ""; }).slice(0, 2).join("").toUpperCase() || "U";
      var inner = foto ? '<img src="' + foto + '" alt="Foto de perfil">' : '<span>' + pesc(iniciais) + '</span>';
      perfilHeader.innerHTML =
        '<div class="pf-card">' +
          '<div class="pf-frame">' +
            '<div class="pf-avatar">' + inner + '</div>' +
            '<button type="button" class="pf-foto-btn" id="pfFotoBtn" title="Trocar foto de perfil" aria-label="Trocar foto de perfil">📷</button>' +
            '<input type="file" id="pfFotoInput" accept="image/*" hidden>' +
          '</div>' +
          '<div class="pf-info">' +
            '<div class="pf-nome">' + pesc(nome) + '</div>' +
            '<div class="pf-papel">' + pesc(papel) + '</div>' +
          '</div>' +
        '</div>';
      var btn = document.getElementById("pfFotoBtn"), inp = document.getElementById("pfFotoInput");
      if (btn && inp) {
        btn.addEventListener("click", function () { inp.click(); });
        inp.addEventListener("change", function () {
          var f = inp.files && inp.files[0]; if (!f) return;
          var rd = new FileReader();
          rd.onload = function () {
            var img = new Image();
            img.onload = function () {
              var sz = 256, c = document.createElement("canvas"); c.width = sz; c.height = sz;
              var ctx = c.getContext("2d"); var min = Math.min(img.width, img.height);
              ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, sz, sz);
              var data;
              try { data = c.toDataURL("image/jpeg", 0.85); } catch (e) { return; }
              try { localStorage.setItem(fotoKey, data); } catch (e) { alert("Não foi possível salvar a foto (imagem muito grande)."); return; }
              var av = perfilHeader.querySelector(".pf-avatar");
              if (av) av.innerHTML = '<img src="' + data + '" alt="Foto de perfil">';
            };
            img.src = rd.result;
          };
          rd.readAsDataURL(f);
        });
      }
    }, function () {});
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

  // ==========================================================
  // PROPOSTAS — helpers compartilhados
  // ==========================================================
  var PROP_STATUS_LABEL = { rascunho: "Rascunho", enviada: "Enviada", aceita: "Aceita", recusada: "Recusada" };
  function propEsc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function propBRL(n) {
    n = Number(n) || 0;
    var neg = n < 0; n = Math.abs(n);
    var s = n.toFixed(2).split("."); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (neg ? "- " : "") + "R$ " + s[0] + "," + s[1];
  }
  function propData(s) { if (!s) return "—"; var d = new Date(String(s).length === 10 ? s + "T00:00:00" : s); return isNaN(d) ? "—" : d.toLocaleDateString("pt-BR"); }
  function propStatusHtml(st) { var ok = PROP_STATUS_LABEL[st] ? st : "rascunho"; return '<span class="st st-' + ok + '">' + PROP_STATUS_LABEL[ok] + '</span>'; }

  // ---- Propostas: LISTA ----
  var propostasRoot = document.getElementById("propostasRoot");
  if (propostasRoot && window.TPData) {
    var filtroEl = document.getElementById("propostasFiltro");
    var resumoEl = document.getElementById("propostasResumo");
    var propostasCache = [];
    var filtroAtivo = "todos";

    function propResumo(list) {
      var by = { rascunho: 0, enviada: 0, aceita: 0, recusada: 0 }, totalAceita = 0;
      list.forEach(function (p) { by[p.status] = (by[p.status] || 0) + 1; if (p.status === "aceita") totalAceita += Number(p.total) || 0; });
      if (resumoEl) resumoEl.innerHTML =
        '<div class="kpi"><div class="val">' + list.length + '</div><div class="lbl">Propostas</div></div>' +
        '<div class="kpi"><div class="val">' + by.enviada + '</div><div class="lbl">Enviadas</div></div>' +
        '<div class="kpi"><div class="val">' + by.aceita + '</div><div class="lbl">Aceitas</div></div>' +
        '<div class="kpi"><div class="val" style="font-size:var(--tp-fs-xl)">' + propBRL(totalAceita) + '</div><div class="lbl">Total aceito</div></div>';
    }

    function propFiltros(list) {
      if (!filtroEl) return;
      var counts = { todos: list.length, rascunho: 0, enviada: 0, aceita: 0, recusada: 0 };
      list.forEach(function (p) { counts[p.status] = (counts[p.status] || 0) + 1; });
      var chips = [["todos", "Todas"], ["rascunho", "Rascunho"], ["enviada", "Enviada"], ["aceita", "Aceita"], ["recusada", "Recusada"]];
      filtroEl.innerHTML = chips.map(function (c) {
        return '<button class="prop-chip' + (filtroAtivo === c[0] ? " active" : "") + '" data-f="' + c[0] + '">' + c[1] + " (" + (counts[c[0]] || 0) + ")</button>";
      }).join("");
      Array.prototype.forEach.call(filtroEl.querySelectorAll("[data-f]"), function (b) {
        b.addEventListener("click", function () { filtroAtivo = b.getAttribute("data-f"); renderProp(); });
      });
    }

    function renderProp() {
      propFiltros(propostasCache);
      if (!propostasCache.length) {
        propostasRoot.innerHTML = '<div class="gestao-empty" style="padding:44px 28px">Nenhuma proposta ainda. Clique em <strong>“+ Nova proposta”</strong> para começar.</div>';
        return;
      }
      var list = filtroAtivo === "todos" ? propostasCache : propostasCache.filter(function (p) { return p.status === filtroAtivo; });
      if (!list.length) { propostasRoot.innerHTML = '<div class="gestao-empty" style="padding:36px">Nenhuma proposta neste filtro.</div>'; return; }
      var rows = list.map(function (p) {
        return '<tr>' +
          '<td style="font-weight:600">' + (propEsc(p.numero) || "—") + '</td>' +
          '<td><a href="proposta-view.html?id=' + encodeURIComponent(p.id) + '" style="font-weight:600;color:inherit">' + (propEsc(p.titulo) || "(sem título)") + '</a><div class="muted" style="font-size:var(--tp-fs-xs)">' + (propEsc(p.cliente_nome) || "—") + '</div></td>' +
          '<td style="text-align:right;white-space:nowrap">' + propBRL(p.total) + '</td>' +
          '<td>' + propStatusHtml(p.status) + '</td>' +
          '<td style="white-space:nowrap">' + propData(p.validade) + '</td>' +
          '<td><div class="prop-acts">' +
            '<a class="btn btn-ghost btn-sm" href="proposta-view.html?id=' + encodeURIComponent(p.id) + '">Ver</a>' +
            '<a class="btn btn-ghost btn-sm" href="proposta.html?id=' + encodeURIComponent(p.id) + '">Editar</a>' +
            '<button class="btn btn-ghost btn-sm" data-del="' + p.id + '">Excluir</button>' +
          '</div></td>' +
        '</tr>';
      }).join("");
      propostasRoot.innerHTML = '<div class="panel"><div class="table-wrap"><table class="table">' +
        '<thead><tr><th>Nº</th><th>Proposta</th><th style="text-align:right">Total</th><th>Status</th><th>Validade</th><th></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div></div>';
      Array.prototype.forEach.call(propostasRoot.querySelectorAll("[data-del]"), function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-del");
          var p = propostasCache.filter(function (x) { return x.id === id; })[0];
          if (confirm('Excluir a proposta "' + ((p && p.titulo) || "") + '"? Esta ação não pode ser desfeita.')) {
            TPData.deleteProposta(id).then(loadProp);
          }
        });
      });
    }

    function loadProp() {
      return TPData.listPropostas().then(function (list) {
        propostasCache = list || []; propResumo(propostasCache); renderProp();
      }, function () { propostasRoot.innerHTML = '<div class="gestao-empty" style="padding:40px">Não foi possível carregar as propostas.</div>'; });
    }

    propostasRoot.innerHTML = '<div class="gestao-empty" style="padding:40px">Carregando…</div>';
    TPData.session().then(function (s) { if (!s) { window.location.replace("login.html"); return; } loadProp(); }, function () { loadProp(); });
  }

  // ---- Propostas: FORMULÁRIO (criar/editar) ----
  var propostaForm = document.getElementById("propostaForm");
  if (propostaForm && window.TPData) {
    var pfMsg = document.getElementById("propFormMsg");
    var itensBox = document.getElementById("propItens");
    var totalEl = document.getElementById("propTotal");
    var descEl = document.getElementById("p_desconto");
    var addItemBtn = document.getElementById("addItem");
    var pid = new URLSearchParams(location.search).get("id") || "novo";
    var editando = pid && pid !== "novo";

    function pfShow(t, ok) { if (!pfMsg) return; pfMsg.textContent = t; pfMsg.className = "form-msg show " + (ok ? "ok" : "err"); if (!ok) pfMsg.scrollIntoView({ behavior: "smooth", block: "center" }); }
    function pfVal(id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; }

    function itemRow(it) {
      it = it || {};
      var row = document.createElement("div");
      row.className = "pf-item";
      row.innerHTML =
        '<input data-k="descricao" type="text" placeholder="Descrição do item">' +
        '<input data-k="quantidade" type="number" min="0" step="1" placeholder="1">' +
        '<input data-k="valor_unitario" type="number" min="0" step="0.01" placeholder="0,00">' +
        '<div class="pf-lt">R$ 0,00</div>' +
        '<button type="button" class="pf-rm" aria-label="Remover item">&times;</button>';
      row.querySelector('[data-k="descricao"]').value = it.descricao || "";
      row.querySelector('[data-k="quantidade"]').value = it.quantidade != null ? it.quantidade : "";
      row.querySelector('[data-k="valor_unitario"]').value = it.valor_unitario != null ? it.valor_unitario : "";
      row.addEventListener("input", recalcProp);
      row.querySelector(".pf-rm").addEventListener("click", function () { row.parentNode.removeChild(row); recalcProp(); });
      return row;
    }
    function coletaItens() {
      return Array.prototype.map.call(itensBox.querySelectorAll(".pf-item"), function (r) {
        return {
          descricao: r.querySelector('[data-k="descricao"]').value.trim(),
          quantidade: Number(r.querySelector('[data-k="quantidade"]').value) || 0,
          valor_unitario: Number(r.querySelector('[data-k="valor_unitario"]').value) || 0
        };
      });
    }
    function recalcProp() {
      var itens = coletaItens();
      Array.prototype.forEach.call(itensBox.querySelectorAll(".pf-item"), function (r, i) {
        r.querySelector(".pf-lt").textContent = propBRL(itens[i].quantidade * itens[i].valor_unitario);
      });
      totalEl.textContent = propBRL(TPProposta.calcTotal(itens, descEl.value));
    }
    if (addItemBtn) addItemBtn.addEventListener("click", function () { itensBox.appendChild(itemRow({ quantidade: 1 })); recalcProp(); });
    if (descEl) descEl.addEventListener("input", recalcProp);

    function preencher(p) {
      document.getElementById("p_titulo").value = p.titulo || "";
      document.getElementById("p_validade").value = p.validade || "";
      document.getElementById("p_cliente_nome").value = p.cliente_nome || "";
      document.getElementById("p_cliente_documento").value = p.cliente_documento || "";
      document.getElementById("p_cliente_email").value = p.cliente_email || "";
      document.getElementById("p_cliente_telefone").value = p.cliente_telefone || "";
      document.getElementById("p_status").value = p.status || "rascunho";
      document.getElementById("p_desconto").value = p.desconto || 0;
      document.getElementById("p_obs").value = p.observacoes || "";
      document.getElementById("p_cond").value = p.condicoes || "";
      itensBox.innerHTML = "";
      (p.itens || []).forEach(function (it) { itensBox.appendChild(itemRow(it)); });
      if (!(p.itens || []).length) itensBox.appendChild(itemRow({ quantidade: 1 }));
      recalcProp();
    }

    function coletaProposta() {
      return {
        titulo: pfVal("p_titulo"), validade: pfVal("p_validade") || null,
        cliente_nome: pfVal("p_cliente_nome"), cliente_documento: pfVal("p_cliente_documento"),
        cliente_email: pfVal("p_cliente_email"), cliente_telefone: pfVal("p_cliente_telefone"),
        status: document.getElementById("p_status").value,
        desconto: Number(descEl.value) || 0,
        observacoes: pfVal("p_obs"), condicoes: pfVal("p_cond"),
        itens: coletaItens().filter(function (it) { return it.descricao || it.valor_unitario; })
      };
    }

    propostaForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = coletaProposta();
      if (!d.titulo) return pfShow("Informe um título para a proposta.", false);
      if (!d.itens.length) return pfShow("Adicione ao menos um item com descrição ou valor.", false);
      var btn = propostaForm.querySelector('button[type="submit"]'); btn.disabled = true;
      var req = editando ? TPData.updateProposta(pid, d) : TPData.addProposta(d);
      req.then(function (r) {
        btn.disabled = false;
        if (r && r.ok === false) return pfShow(r.error || "Não foi possível salvar.", false);
        var novoId = editando ? pid : (r.proposta && r.proposta.id);
        pfShow("Proposta salva! ✓", true);
        setTimeout(function () { window.location.href = novoId ? ("proposta-view.html?id=" + encodeURIComponent(novoId)) : "propostas.html"; }, 700);
      }, function () { btn.disabled = false; pfShow("Erro de conexão. Tente novamente.", false); });
    });

    var titleEl = document.getElementById("propFormTitle"), crumbEl = document.getElementById("propCrumb");
    TPData.session().then(function (s) {
      if (!s) { window.location.replace("login.html"); return; }
      if (editando) {
        if (titleEl) titleEl.textContent = "Editar proposta";
        if (crumbEl) crumbEl.textContent = "Editar proposta";
        TPData.getProposta(pid).then(function (p) {
          if (!p) { pfShow("Proposta não encontrada.", false); itensBox.appendChild(itemRow({ quantidade: 1 })); recalcProp(); return; }
          preencher(p);
        }, function () { pfShow("Não foi possível carregar a proposta.", false); itensBox.appendChild(itemRow({ quantidade: 1 })); recalcProp(); });
      } else {
        itensBox.appendChild(itemRow({ quantidade: 1 })); recalcProp();
      }
    }, function () { itensBox.appendChild(itemRow({ quantidade: 1 })); recalcProp(); });
  }

  // ---- Propostas: VISUALIZAÇÃO (imprimível) ----
  var propostaView = document.getElementById("propostaView");
  if (propostaView && window.TPData) {
    var pvId = new URLSearchParams(location.search).get("id");
    var pvPrint = document.getElementById("pvPrint");
    var pvEdit = document.getElementById("pvEdit");
    if (pvEdit && pvId) pvEdit.href = "proposta.html?id=" + encodeURIComponent(pvId);
    if (pvPrint) pvPrint.addEventListener("click", function () { window.print(); });

    function renderDoc(p) {
      var linhas = (p.itens || []).map(function (it) {
        var t = (Number(it.quantidade) || 0) * (Number(it.valor_unitario) || 0);
        return '<tr><td>' + (propEsc(it.descricao) || "—") + '</td><td class="num">' + (Number(it.quantidade) || 0) + '</td><td class="num">' + propBRL(it.valor_unitario) + '</td><td class="num">' + propBRL(t) + '</td></tr>';
      }).join("");
      var cliente = [
        p.cliente_nome ? '<div><span class="k">Cliente:</span>' + propEsc(p.cliente_nome) + '</div>' : '',
        p.cliente_documento ? '<div><span class="k">Documento:</span>' + propEsc(p.cliente_documento) + '</div>' : '',
        p.cliente_email ? '<div><span class="k">E-mail:</span>' + propEsc(p.cliente_email) + '</div>' : '',
        p.cliente_telefone ? '<div><span class="k">Telefone:</span>' + propEsc(p.cliente_telefone) + '</div>' : ''
      ].join("");
      var desconto = Number(p.desconto) || 0;
      propostaView.innerHTML =
        '<div class="prop-doc">' +
          '<div class="pd-head"><img src="assets/img/logo.svg" alt="Sona"><div class="pd-meta"><div><strong>' + (propEsc(p.numero) || "Proposta") + '</strong></div>' + propStatusHtml(p.status) + (p.validade ? '<div style="margin-top:6px">Validade: ' + propData(p.validade) + '</div>' : '') + '</div></div>' +
          '<h1 class="pd-title">' + (propEsc(p.titulo) || "Proposta") + '</h1>' +
          (cliente ? '<div class="pd-cliente">' + cliente + '</div>' : '') +
          '<table class="pd-itens"><thead><tr><th>Descrição</th><th class="num">Qtd</th><th class="num">Valor unit.</th><th class="num">Total</th></tr></thead><tbody>' + (linhas || '<tr><td colspan="4" class="muted">Sem itens.</td></tr>') + '</tbody></table>' +
          (desconto ? '<div class="pd-tot"><span class="lbl">Desconto</span><span class="v" style="font-size:var(--tp-fs-lg)">' + propBRL(-desconto) + '</span></div>' : '') +
          '<div class="pd-tot"><span class="lbl">Total</span><span class="v">' + propBRL(p.total) + '</span></div>' +
          (p.condicoes ? '<div class="pd-sec"><h4>Condições comerciais</h4><p>' + propEsc(p.condicoes) + '</p></div>' : '') +
          (p.observacoes ? '<div class="pd-sec"><h4>Observações</h4><p>' + propEsc(p.observacoes) + '</p></div>' : '') +
        '</div>';
    }

    TPData.session().then(function (s) {
      if (!s) { window.location.replace("login.html"); return; }
      if (!pvId) { propostaView.innerHTML = '<div class="gestao-empty" style="padding:40px">Proposta não informada.</div>'; return; }
      TPData.getProposta(pvId).then(function (p) {
        if (!p) { propostaView.innerHTML = '<div class="gestao-empty" style="padding:40px">Proposta não encontrada.</div>'; return; }
        renderDoc(p);
      }, function () { propostaView.innerHTML = '<div class="gestao-empty" style="padding:40px">Não foi possível carregar a proposta.</div>'; });
    }, function () {});
  }

  // ---- Dashboard: resumo de propostas ----
  var dashPropResumo = document.getElementById("dashPropResumo");
  var dashPropRecentes = document.getElementById("dashPropRecentes");
  if ((dashPropResumo || dashPropRecentes) && window.TPData) {
    TPData.listPropostas().then(function (list) {
      list = list || [];
      var by = { rascunho: 0, enviada: 0, aceita: 0, recusada: 0 }, totalAceita = 0;
      list.forEach(function (p) { by[p.status] = (by[p.status] || 0) + 1; if (p.status === "aceita") totalAceita += Number(p.total) || 0; });
      if (dashPropResumo) dashPropResumo.innerHTML =
        '<div class="kpi"><div class="val">' + list.length + '</div><div class="lbl">Propostas</div></div>' +
        '<div class="kpi"><div class="val">' + by.enviada + '</div><div class="lbl">Enviadas</div></div>' +
        '<div class="kpi"><div class="val">' + by.aceita + '</div><div class="lbl">Aceitas</div></div>' +
        '<div class="kpi"><div class="val" style="font-size:var(--tp-fs-xl)">' + propBRL(totalAceita) + '</div><div class="lbl">Total aceito</div></div>';
      if (dashPropRecentes) {
        if (!list.length) { dashPropRecentes.innerHTML = '<div class="gestao-empty" style="padding:26px">Nenhuma proposta ainda. <a href="proposta.html?id=novo">Criar a primeira</a>.</div>'; return; }
        var rows = list.slice(0, 5).map(function (p) {
          return '<tr>' +
            '<td style="font-weight:600">' + (propEsc(p.numero) || "—") + '</td>' +
            '<td><a href="proposta-view.html?id=' + encodeURIComponent(p.id) + '" style="font-weight:600;color:inherit">' + (propEsc(p.titulo) || "(sem título)") + '</a></td>' +
            '<td style="text-align:right;white-space:nowrap">' + propBRL(p.total) + '</td>' +
            '<td>' + propStatusHtml(p.status) + '</td>' +
          '</tr>';
        }).join("");
        dashPropRecentes.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>Nº</th><th>Proposta</th><th style="text-align:right">Total</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
      }
    }, function () {
      if (dashPropResumo) dashPropResumo.innerHTML = '<div class="gestao-empty" style="grid-column:1/-1;padding:24px">Não foi possível carregar o resumo.</div>';
      if (dashPropRecentes) dashPropRecentes.innerHTML = "";
    });
  }

  // ---- User-chip (topbar): nome/papel + botão Sair ----
  (function () {
    var chip = document.querySelector(".user-chip");
    if (!chip) return;
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

  // Anima as barras de progresso ao carregar.
  window.addEventListener("load", function () {
    document.querySelectorAll(".progress > i").forEach(function (fill) {
      var w = fill.style.width;
      fill.style.width = "0%";
      setTimeout(function () { fill.style.width = w; }, 200);
    });
  });
})();
