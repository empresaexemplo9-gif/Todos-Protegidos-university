// ============================================================
// TODOS PROTEGIDOS — Camada de dados (TPData)
// Usa Supabase quando configurado (assets/js/config.js);
// caso contrário, funciona em modo LOCAL (localStorage).
// API uniforme baseada em Promises para os dois modos.
// ============================================================
(function () {
  "use strict";

  var cfg = window.TP_CONFIG || {};
  var hasSB = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  var sb = hasSB ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  var ADMIN_EMAIL = (cfg.ADMIN_EMAIL || "admin@todosprotegidos.com.br").toLowerCase();
  var ADMIN_LOCAL_SENHA = cfg.ADMIN_LOCAL_SENHA || "admin2026";

  // ---------- helpers locais ----------
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function traduzErro(msg) {
    msg = (msg || "").toLowerCase();
    if (msg.indexOf("already registered") >= 0 || msg.indexOf("already exists") >= 0) return "Já existe um acesso com esse e-mail.";
    if (msg.indexOf("invalid login") >= 0) return "Usuário ou senha inválidos.";
    if (msg.indexOf("password") >= 0 && msg.indexOf("6") >= 0) return "A senha deve ter pelo menos 6 caracteres.";
    if (msg.indexOf("email") >= 0 && msg.indexOf("confirm") >= 0) return "Confirme seu e-mail antes de entrar.";
    return msg ? (msg.charAt(0).toUpperCase() + msg.slice(1)) : "Não foi possível concluir. Tente novamente.";
  }

  function modulosDefault() {
    return [
      { id: uid(), titulo: "Nível 1 · Novato", sub: "Fundamentos da proteção veicular e cultura da empresa", itens: [
        { id: uid(), tipo: "video", titulo: "Boas-vindas e cultura Todos Protegidos", meta: "08:00", url: "", desc: "" },
        { id: uid(), tipo: "info", titulo: "Benefícios (assistência 24h, FIPE, carro e moto)", meta: "Texto de apoio", url: "", desc: "" }
      ] },
      { id: uid(), titulo: "Nível 2 · Intermediário", sub: "Padrão de atendimento e abordagem", itens: [
        { id: uid(), tipo: "aula", titulo: "Abordagem: formas e técnicas", meta: "5 modelos de abordagem", url: "", desc: "" }
      ] },
      { id: uid(), titulo: "Nível 3 · Avançado", sub: "Protocolos de venda, vistoria e objeções", itens: [
        { id: uid(), tipo: "info", titulo: "Contorno de 10 objeções", meta: "Biblioteca de scripts", url: "", desc: "" },
        { id: uid(), tipo: "file", titulo: "Checklist de vistoria", meta: "PDF", url: "", desc: "" }
      ] },
      { id: uid(), titulo: "Nível 4 · Pro", sub: "Gestão de carteira, pós-venda e mentoria", itens: [
        { id: uid(), tipo: "info", titulo: "Reativação de inadimplentes", meta: "Scripts de voz e WhatsApp", url: "", desc: "" }
      ] }
    ];
  }

  // =================== Modo LOCAL ===================
  var Local = {
    register: function (d) {
      var consultores = lsGet("tp_consultores", []);
      if (consultores.some(function (c) { return c.email === d.email; }))
        return Promise.resolve({ ok: false, error: "Já existe um acesso com esse e-mail. Tente entrar." });
      consultores.push({ id: uid(), nome: d.nome, email: d.email, telefone: d.telefone, senha: d.senha, role: "consultor", criadoEm: new Date().toISOString() });
      lsSet("tp_consultores", consultores);
      var sess = { nome: d.nome, email: d.email, telefone: d.telefone, role: "consultor" };
      lsSet("tp_sessao", sess);
      return Promise.resolve({ ok: true, session: sess });
    },
    login: function (user, senha) {
      var ukey = user.toLowerCase();
      if (ukey === "admin" && senha === ADMIN_LOCAL_SENHA) {
        var a = { nome: "Administrador", email: "admin", telefone: "", role: "admin" };
        lsSet("tp_sessao", a);
        return Promise.resolve({ ok: true, session: a });
      }
      var conta = lsGet("tp_consultores", []).filter(function (c) { return c.email === ukey && c.senha === senha; })[0];
      if (conta) {
        var s = { nome: conta.nome, email: conta.email, telefone: conta.telefone || "", role: "consultor" };
        lsSet("tp_sessao", s);
        return Promise.resolve({ ok: true, session: s });
      }
      return Promise.resolve({ ok: false, error: "Usuário ou senha inválidos. Verifique e tente novamente." });
    },
    logout: function () { try { localStorage.removeItem("tp_sessao"); } catch (e) {} return Promise.resolve(); },
    session: function () { return Promise.resolve(lsGet("tp_sessao", null)); },

    updateProfile: function (d) {
      var sess = lsGet("tp_sessao", null);
      if (!sess) return Promise.resolve({ ok: false, error: "Sessão expirada." });
      var cons = lsGet("tp_consultores", []);
      cons.forEach(function (c) { if (c.email === sess.email) { c.nome = d.nome; c.telefone = d.telefone; } });
      lsSet("tp_consultores", cons);
      sess.nome = d.nome; sess.telefone = d.telefone; lsSet("tp_sessao", sess);
      return Promise.resolve({ ok: true });
    },
    updatePassword: function (nova) {
      var sess = lsGet("tp_sessao", null);
      if (!sess) return Promise.resolve({ ok: false, error: "Sessão expirada." });
      var cons = lsGet("tp_consultores", []);
      cons.forEach(function (c) { if (c.email === sess.email) { c.senha = nova; } });
      lsSet("tp_consultores", cons);
      return Promise.resolve({ ok: true });
    },
    updateEmail: function (novo) {
      novo = (novo || "").toLowerCase();
      var sess = lsGet("tp_sessao", null);
      if (!sess) return Promise.resolve({ ok: false, error: "Sessão expirada." });
      var cons = lsGet("tp_consultores", []);
      if (cons.some(function (c) { return c.email === novo && c.email !== sess.email; }))
        return Promise.resolve({ ok: false, error: "Já existe um acesso com esse e-mail." });
      cons.forEach(function (c) { if (c.email === sess.email) { c.email = novo; } });
      lsSet("tp_consultores", cons);
      sess.email = novo; lsSet("tp_sessao", sess);
      return Promise.resolve({ ok: true });
    },
    uploadFile: function () {
      return Promise.resolve({ ok: false, error: "O upload de vídeo está disponível no modo nuvem (Supabase). Cole a URL do vídeo." });
    },
    getProgress: function () { return Promise.resolve(lsGet("tp_progresso", [])); },
    setProgress: function (itemId, done) {
      var p = lsGet("tp_progresso", []);
      if (done) { if (p.indexOf(itemId) < 0) p.push(itemId); } else { p = p.filter(function (x) { return x !== itemId; }); }
      lsSet("tp_progresso", p);
      return Promise.resolve({ ok: true });
    },

    listModules: function () {
      var m = lsGet("tp_modulos", null);
      if (!Array.isArray(m)) { m = modulosDefault(); lsSet("tp_modulos", m); }
      return Promise.resolve(m);
    },
    addModule: function (titulo, sub) {
      var m = lsGet("tp_modulos", modulosDefault());
      var mod = { id: uid(), titulo: titulo, sub: sub || "", itens: [] };
      m.push(mod); lsSet("tp_modulos", m);
      return Promise.resolve({ ok: true, module: mod });
    },
    deleteModule: function (id) {
      var m = lsGet("tp_modulos", []).filter(function (x) { return x.id !== id; });
      lsSet("tp_modulos", m); return Promise.resolve({ ok: true });
    },
    addItem: function (modId, item) {
      var m = lsGet("tp_modulos", []);
      var mod = m.filter(function (x) { return x.id === modId; })[0];
      if (!mod) return Promise.resolve({ ok: false, error: "Módulo não encontrado." });
      var it = { id: uid(), tipo: item.tipo, titulo: item.titulo, meta: item.meta, url: item.url, desc: item.desc };
      mod.itens.push(it); lsSet("tp_modulos", m);
      return Promise.resolve({ ok: true, item: it });
    },
    deleteItem: function (id) {
      var m = lsGet("tp_modulos", []);
      m.forEach(function (mod) { mod.itens = mod.itens.filter(function (it) { return it.id !== id; }); });
      lsSet("tp_modulos", m); return Promise.resolve({ ok: true });
    },
    resetModules: function () { var d = modulosDefault(); lsSet("tp_modulos", d); return Promise.resolve({ ok: true }); }
  };

  // =================== Modo SUPABASE ===================
  var Cloud = {
    register: function (d) {
      var tenant = (d.tenant || "").trim();
      return sb.rpc("tenant_existe", { p_slug: tenant }).then(function (rc) {
        if (rc.error) return { ok: false, error: "Não foi possível validar o código da empresa." };
        if (!rc.data) return { ok: false, error: "Código da empresa/unidade inválido." };
        return sb.auth.signUp({ email: d.email, password: d.senha, options: { data: { nome: d.nome, telefone: d.telefone, tenant: tenant } } })
          .then(function (r) {
            if (r.error) return { ok: false, error: traduzErro(r.error.message) };
            if (!r.data.session) return { ok: true, needsConfirm: true, session: null };
            return Cloud.session().then(function (s) { return { ok: true, session: s }; });
          });
      });
    },
    login: function (user, senha) {
      var email = (user.toLowerCase() === "admin") ? ADMIN_EMAIL : user;
      return sb.auth.signInWithPassword({ email: email, password: senha })
        .then(function (r) {
          if (r.error) return { ok: false, error: traduzErro(r.error.message) };
          return Cloud.session().then(function (s) { return { ok: true, session: s }; });
        });
    },
    logout: function () { return sb.auth.signOut().then(function () {}); },
    session: function () {
      return sb.auth.getUser().then(function (r) {
        var user = r.data && r.data.user;
        if (!user) return null;
        return sb.from("profiles").select("nome,telefone,role").eq("id", user.id).single()
          .then(function (p) {
            var prof = p.data || {};
            return { nome: prof.nome || user.email, email: user.email, telefone: prof.telefone || "", role: prof.role || "consultor" };
          });
      });
    },
    updateProfile: function (d) {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user;
        if (!u) return { ok: false, error: "Sessão expirada. Entre novamente." };
        return sb.from("profiles").update({ nome: d.nome, telefone: d.telefone }).eq("id", u.id)
          .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
      });
    },
    updatePassword: function (nova) {
      return sb.auth.updateUser({ password: nova })
        .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
    },
    updateEmail: function (novo) {
      return sb.auth.updateUser({ email: (novo || "").toLowerCase() })
        .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true, needsConfirm: true }; });
    },
    uploadFile: function (file) {
      var safe = (file.name || "video").replace(/[^\w.\-]+/g, "_");
      var path = "videoaulas/" + Date.now() + "_" + safe;
      return sb.storage.from("midia").upload(path, file, { cacheControl: "3600", upsert: false })
        .then(function (res) {
          if (res.error) return { ok: false, error: traduzErro(res.error.message) };
          var pub = sb.storage.from("midia").getPublicUrl(path);
          return { ok: true, url: pub.data.publicUrl };
        });
    },
    getProgress: function () {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return [];
        return sb.from("progresso").select("item_id").eq("user_id", u.id)
          .then(function (res) { return (res.data || []).map(function (x) { return x.item_id; }); });
      });
    },
    setProgress: function (itemId, done) {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return { ok: false, error: "Sessão expirada." };
        if (done) return sb.from("progresso").upsert({ user_id: u.id, item_id: itemId }).then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
        return sb.from("progresso").delete().eq("user_id", u.id).eq("item_id", itemId).then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
      });
    },
    listModules: function () {
      return Promise.all([
        sb.from("modulos").select("*").order("ordem", { ascending: true }),
        sb.from("itens").select("*").order("ordem", { ascending: true })
      ]).then(function (res) {
        var mods = res[0].data || [], items = res[1].data || [];
        return mods.map(function (m) {
          return {
            id: m.id, titulo: m.titulo, sub: m.subtitulo,
            itens: items.filter(function (it) { return it.modulo_id === m.id; }).map(function (it) {
              return { id: it.id, tipo: it.tipo, titulo: it.titulo, meta: it.meta, url: it.url, desc: it.descricao };
            })
          };
        });
      });
    },
    addModule: function (titulo, sub) {
      return sb.from("modulos").insert({ titulo: titulo, subtitulo: sub || "", ordem: Date.now() }).select().single()
        .then(function (r) {
          if (r.error) return { ok: false, error: traduzErro(r.error.message) };
          return { ok: true, module: { id: r.data.id, titulo: r.data.titulo, sub: r.data.subtitulo, itens: [] } };
        });
    },
    deleteModule: function (id) {
      return sb.from("modulos").delete().eq("id", id).then(function (r) { return { ok: !r.error, error: r.error && traduzErro(r.error.message) }; });
    },
    addItem: function (modId, item) {
      return sb.from("itens").insert({ modulo_id: modId, tipo: item.tipo, titulo: item.titulo, meta: item.meta, url: item.url, descricao: item.desc, ordem: Date.now() }).select().single()
        .then(function (r) {
          if (r.error) return { ok: false, error: traduzErro(r.error.message) };
          return { ok: true, item: { id: r.data.id, tipo: r.data.tipo, titulo: r.data.titulo, meta: r.data.meta, url: r.data.url, desc: r.data.descricao } };
        });
    },
    deleteItem: function (id) {
      return sb.from("itens").delete().eq("id", id).then(function (r) { return { ok: !r.error, error: r.error && traduzErro(r.error.message) }; });
    },
    resetModules: function () { return Promise.resolve({ ok: false, error: "Indisponível no modo nuvem." }); }
  };

  var impl = hasSB ? Cloud : Local;

  window.TPData = {
    backend: hasSB ? "supabase" : "local",
    configured: function () { return hasSB; },
    register: function (d) { return impl.register(d); },
    login: function (u, s) { return impl.login(u, s); },
    logout: function () { return impl.logout(); },
    session: function () { return impl.session(); },
    updateProfile: function (d) { return impl.updateProfile(d); },
    updatePassword: function (nova) { return impl.updatePassword(nova); },
    updateEmail: function (novo) { return impl.updateEmail(novo); },
    uploadFile: function (file) { return impl.uploadFile(file); },
    getProgress: function () { return impl.getProgress(); },
    setProgress: function (id, done) { return impl.setProgress(id, done); },
    listModules: function () { return impl.listModules(); },
    addModule: function (t, s) { return impl.addModule(t, s); },
    deleteModule: function (id) { return impl.deleteModule(id); },
    addItem: function (m, it) { return impl.addItem(m, it); },
    deleteItem: function (id) { return impl.deleteItem(id); },
    resetModules: function () { return impl.resetModules(); }
  };
})();
