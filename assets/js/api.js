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
      if ((ukey === "admin" || ukey === "presidente") && senha === ADMIN_LOCAL_SENHA) {
        var a = { nome: "Administrador", email: "admin", telefone: "", role: "admin", titulo: "Presidente da empresa" };
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
    listQuestions: function (modId) {
      var all = lsGet("tp_questoes", {});
      return Promise.resolve((all[modId] || []).slice());
    },
    addQuestion: function (modId, q) {
      var all = lsGet("tp_questoes", {});
      var arr = all[modId] || [];
      var nova = { id: uid(), enunciado: q.enunciado, opcoes: q.opcoes, correta: q.correta };
      arr.push(nova); all[modId] = arr; lsSet("tp_questoes", all);
      return Promise.resolve({ ok: true, question: nova });
    },
    updateQuestion: function (id, q) {
      var all = lsGet("tp_questoes", {});
      Object.keys(all).forEach(function (k) { all[k].forEach(function (it) { if (it.id === id) { it.enunciado = q.enunciado; it.opcoes = q.opcoes; it.correta = q.correta; } }); });
      lsSet("tp_questoes", all);
      return Promise.resolve({ ok: true });
    },
    deleteQuestion: function (id) {
      var all = lsGet("tp_questoes", {});
      Object.keys(all).forEach(function (k) { all[k] = all[k].filter(function (it) { return it.id !== id; }); });
      lsSet("tp_questoes", all);
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
    resetModules: function () { var d = modulosDefault(); lsSet("tp_modulos", d); return Promise.resolve({ ok: true }); },

    listTeam: function () {
      return Promise.resolve(lsGet("tp_consultores", []).map(function (c) { return { id: c.email, nome: c.nome, role: c.role || "consultor", titulo: c.titulo || "" }; }));
    },
    listAllProgress: function () { return Promise.resolve([]); },
    saveQuizResult: function (modId, nota, aprovado) {
      var all = lsGet("tp_resultados", {});
      all[modId] = { nota: nota, aprovado: aprovado, feito_em: new Date().toISOString() };
      lsSet("tp_resultados", all);
      return Promise.resolve({ ok: true });
    },
    listAllResults: function () { return Promise.resolve([]); },
    listQuizModules: function () {
      var q = lsGet("tp_questoes", {});
      return Promise.resolve(Object.keys(q).filter(function (k) { return (q[k] || []).length; }));
    },

    listClientes: function () { return Promise.resolve(lsGet("tp_clientes", [])); },
    addCliente: function (d) {
      var arr = lsGet("tp_clientes", []);
      var c = { id: uid(), nome: d.nome, email: d.email || "", telefone: d.telefone || "", documento: d.documento || "", veiculo: d.veiculo || "", status: d.status || "lead", obs: d.obs || "", criado_em: new Date().toISOString() };
      arr.unshift(c); lsSet("tp_clientes", arr);
      return Promise.resolve({ ok: true, cliente: c });
    },
    updateCliente: function (id, d) {
      var arr = lsGet("tp_clientes", []);
      arr.forEach(function (c) { if (c.id === id) { c.nome = d.nome; c.email = d.email; c.telefone = d.telefone; c.documento = d.documento; c.veiculo = d.veiculo; c.status = d.status; c.obs = d.obs; } });
      lsSet("tp_clientes", arr); return Promise.resolve({ ok: true });
    },
    deleteCliente: function (id) {
      lsSet("tp_clientes", lsGet("tp_clientes", []).filter(function (c) { return c.id !== id; }));
      return Promise.resolve({ ok: true });
    },

    listVendas: function () {
      var v = lsGet("tp_vendas", []);
      return Promise.resolve(v.slice().sort(function (a, b) { return (b.data || "").localeCompare(a.data || ""); }));
    },
    addVenda: function (d) {
      var arr = lsGet("tp_vendas", []);
      var v = { id: uid(), cliente_id: d.cliente_id || null, cliente_nome: d.cliente_nome || "", veiculo: d.veiculo || "", plano: d.plano || "", valor: Number(d.valor) || 0, comissao: Number(d.comissao) || 0, status: d.status || "ativa", data: d.data || new Date().toISOString().slice(0, 10), criado_em: new Date().toISOString() };
      arr.unshift(v); lsSet("tp_vendas", arr);
      return Promise.resolve({ ok: true, venda: v });
    },
    updateVenda: function (id, d) {
      var arr = lsGet("tp_vendas", []);
      arr.forEach(function (v) { if (v.id === id) { v.cliente_id = d.cliente_id || null; v.cliente_nome = d.cliente_nome; v.veiculo = d.veiculo; v.plano = d.plano; v.valor = Number(d.valor) || 0; v.comissao = Number(d.comissao) || 0; v.status = d.status; v.data = d.data; } });
      lsSet("tp_vendas", arr); return Promise.resolve({ ok: true });
    },
    deleteVenda: function (id) {
      lsSet("tp_vendas", lsGet("tp_vendas", []).filter(function (v) { return v.id !== id; }));
      return Promise.resolve({ ok: true });
    },

    listCertificates: function () { return Promise.resolve(lsGet("tp_certificados", [])); },
    addCertificate: function (d) {
      var arr = lsGet("tp_certificados", []).filter(function (c) { return !d.modulo_id || c.modulo_id !== d.modulo_id; });
      var c = { id: uid(), modulo_id: d.modulo_id || null, modulo_titulo: d.modulo_titulo || "", score: Number(d.score) || 0, id_validacao: d.id_validacao || "", data: d.data || new Date().toISOString().slice(0, 10), criado_em: new Date().toISOString() };
      arr.unshift(c); lsSet("tp_certificados", arr);
      return Promise.resolve({ ok: true, certificado: c });
    },

    getRanking: function (mes, ano) {
      var vendas = lsGet("tp_vendas", []), sess = lsGet("tp_sessao", null), tv = 0, tc = 0;
      var ym = ano + "-" + ("0" + mes).slice(-2);
      vendas.forEach(function (v) { if (v.status === "cancelada") return; if (String(v.data || "").slice(0, 7) === ym) { tv++; tc += Number(v.comissao) || 0; } });
      if (!tv) return Promise.resolve([]);
      return Promise.resolve([{ user_id: "local", nome: (sess && sess.nome) || "Você", total_vendas: tv, total_comissao: tc }]);
    },
    getMeta: function (mes, ano) { return Promise.resolve(lsGet("tp_metas", {})[ano + "-" + mes] || null); },
    setMeta: function (mes, ano, d) {
      var all = lsGet("tp_metas", {});
      all[ano + "-" + mes] = { mes: mes, ano: ano, meta_vendas: Number(d.meta_vendas) || 0, meta_comissao: Number(d.meta_comissao) || 0 };
      lsSet("tp_metas", all);
      return Promise.resolve({ ok: true });
    }
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
      var u = user.toLowerCase();
      var email = (u === "admin" || u === "presidente") ? ADMIN_EMAIL : user;
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
        return sb.from("profiles").select("nome,telefone,role,titulo").eq("id", user.id).single()
          .then(function (p) {
            var prof = p.data || {};
            return { nome: prof.nome || user.email, email: user.email, telefone: prof.telefone || "", role: prof.role || "consultor", titulo: prof.titulo || "" };
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
    listQuestions: function (modId) {
      return sb.from("questoes").select("*").eq("modulo_id", modId).order("ordem", { ascending: true })
        .then(function (res) { return (res.data || []).map(function (q) { return { id: q.id, enunciado: q.enunciado, opcoes: q.opcoes || [], correta: q.correta }; }); });
    },
    addQuestion: function (modId, q) {
      return sb.from("questoes").insert({ modulo_id: modId, enunciado: q.enunciado, opcoes: q.opcoes, correta: q.correta, ordem: Date.now() }).select().single()
        .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true, question: { id: res.data.id, enunciado: res.data.enunciado, opcoes: res.data.opcoes || [], correta: res.data.correta } }; });
    },
    updateQuestion: function (id, q) {
      return sb.from("questoes").update({ enunciado: q.enunciado, opcoes: q.opcoes, correta: q.correta }).eq("id", id)
        .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
    },
    deleteQuestion: function (id) {
      return sb.from("questoes").delete().eq("id", id)
        .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
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
    resetModules: function () { return Promise.resolve({ ok: false, error: "Indisponível no modo nuvem." }); },

    listTeam: function () {
      return sb.from("profiles").select("id,nome,role,titulo")
        .then(function (res) { return (res.data || []).map(function (p) { return { id: p.id, nome: p.nome || "(sem nome)", role: p.role || "consultor", titulo: p.titulo || "" }; }); });
    },
    listAllProgress: function () {
      return sb.from("progresso").select("user_id,item_id")
        .then(function (res) { return res.data || []; });
    },
    saveQuizResult: function (modId, nota, aprovado) {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return { ok: false, error: "Sessão expirada." };
        return sb.from("resultados").upsert({ user_id: u.id, modulo_id: modId, nota: nota, aprovado: aprovado, feito_em: new Date().toISOString() })
          .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
      });
    },
    listAllResults: function () {
      return sb.from("resultados").select("user_id,modulo_id,nota,aprovado").then(function (res) { return res.data || []; });
    },
    listQuizModules: function () {
      return sb.from("questoes").select("modulo_id").then(function (res) {
        var set = {}; (res.data || []).forEach(function (x) { set[x.modulo_id] = 1; });
        return Object.keys(set);
      });
    },

    listClientes: function () {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return [];
        return sb.from("clientes").select("*").eq("user_id", u.id).order("criado_em", { ascending: false })
          .then(function (res) { if (res.error) throw res.error; return res.data || []; });
      });
    },
    addCliente: function (d) {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return { ok: false, error: "Sessão expirada." };
        return sb.from("clientes").insert({ user_id: u.id, nome: d.nome, email: d.email, telefone: d.telefone, documento: d.documento, veiculo: d.veiculo, status: d.status || "lead", obs: d.obs }).select().single()
          .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true, cliente: res.data }; });
      });
    },
    updateCliente: function (id, d) {
      return sb.from("clientes").update({ nome: d.nome, email: d.email, telefone: d.telefone, documento: d.documento, veiculo: d.veiculo, status: d.status, obs: d.obs }).eq("id", id)
        .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
    },
    deleteCliente: function (id) {
      return sb.from("clientes").delete().eq("id", id)
        .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
    },

    listVendas: function () {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return [];
        return sb.from("vendas").select("*").eq("user_id", u.id).order("data", { ascending: false })
          .then(function (res) { if (res.error) throw res.error; return res.data || []; });
      });
    },
    addVenda: function (d) {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return { ok: false, error: "Sessão expirada." };
        return sb.from("vendas").insert({ user_id: u.id, cliente_id: d.cliente_id || null, cliente_nome: d.cliente_nome, veiculo: d.veiculo, plano: d.plano, valor: Number(d.valor) || 0, comissao: Number(d.comissao) || 0, status: d.status || "ativa", data: d.data }).select().single()
          .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true, venda: res.data }; });
      });
    },
    updateVenda: function (id, d) {
      return sb.from("vendas").update({ cliente_id: d.cliente_id || null, cliente_nome: d.cliente_nome, veiculo: d.veiculo, plano: d.plano, valor: Number(d.valor) || 0, comissao: Number(d.comissao) || 0, status: d.status, data: d.data }).eq("id", id)
        .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
    },
    deleteVenda: function (id) {
      return sb.from("vendas").delete().eq("id", id)
        .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
    },

    listCertificates: function () {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return [];
        return sb.from("certificados").select("*").eq("user_id", u.id).order("data", { ascending: false })
          .then(function (res) { if (res.error) throw res.error; return res.data || []; });
      });
    },
    addCertificate: function (d) {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return { ok: false, error: "Sessão expirada." };
        var row = { user_id: u.id, modulo_id: d.modulo_id || null, modulo_titulo: d.modulo_titulo, score: Number(d.score) || 0, id_validacao: d.id_validacao, data: d.data || new Date().toISOString().slice(0, 10) };
        var ins = function () { return sb.from("certificados").insert(row).select().single().then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true, certificado: res.data }; }); };
        if (row.modulo_id) return sb.from("certificados").delete().eq("user_id", u.id).eq("modulo_id", row.modulo_id).then(ins);
        return ins();
      });
    },

    getRanking: function (mes, ano) {
      return sb.rpc("ranking_mensal", { p_mes: mes, p_ano: ano }).then(function (res) { if (res.error) throw res.error; return res.data || []; });
    },
    getMeta: function (mes, ano) {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return null;
        return sb.from("metas").select("*").eq("user_id", u.id).eq("mes", mes).eq("ano", ano).maybeSingle()
          .then(function (res) { return res.data || null; });
      });
    },
    setMeta: function (mes, ano, d) {
      return sb.auth.getUser().then(function (r) {
        var u = r.data && r.data.user; if (!u) return { ok: false, error: "Sessão expirada." };
        return sb.from("metas").upsert({ user_id: u.id, mes: mes, ano: ano, meta_vendas: Number(d.meta_vendas) || 0, meta_comissao: Number(d.meta_comissao) || 0 }, { onConflict: "user_id,mes,ano" })
          .then(function (res) { return res.error ? { ok: false, error: traduzErro(res.error.message) } : { ok: true }; });
      });
    }
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
    listQuestions: function (m) { return impl.listQuestions(m); },
    addQuestion: function (m, q) { return impl.addQuestion(m, q); },
    updateQuestion: function (id, q) { return impl.updateQuestion(id, q); },
    deleteQuestion: function (id) { return impl.deleteQuestion(id); },
    listModules: function () { return impl.listModules(); },
    addModule: function (t, s) { return impl.addModule(t, s); },
    deleteModule: function (id) { return impl.deleteModule(id); },
    addItem: function (m, it) { return impl.addItem(m, it); },
    deleteItem: function (id) { return impl.deleteItem(id); },
    resetModules: function () { return impl.resetModules(); },
    listTeam: function () { return impl.listTeam(); },
    listAllProgress: function () { return impl.listAllProgress(); },
    saveQuizResult: function (m, n, a) { return impl.saveQuizResult(m, n, a); },
    listAllResults: function () { return impl.listAllResults(); },
    listQuizModules: function () { return impl.listQuizModules(); },
    listClientes: function () { return impl.listClientes(); },
    addCliente: function (d) { return impl.addCliente(d); },
    updateCliente: function (id, d) { return impl.updateCliente(id, d); },
    deleteCliente: function (id) { return impl.deleteCliente(id); },
    listVendas: function () { return impl.listVendas(); },
    addVenda: function (d) { return impl.addVenda(d); },
    updateVenda: function (id, d) { return impl.updateVenda(id, d); },
    deleteVenda: function (id) { return impl.deleteVenda(id); },
    listCertificates: function () { return impl.listCertificates(); },
    addCertificate: function (d) { return impl.addCertificate(d); },
    getRanking: function (mes, ano) { return impl.getRanking(mes, ano); },
    getMeta: function (mes, ano) { return impl.getMeta(mes, ano); },
    setMeta: function (mes, ano, d) { return impl.setMeta(mes, ano, d); }
  };
})();
