// Todos Protegidos — interações leves da interface
(function () {
  "use strict";

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

  // ---- Gestão de conteúdo: expandir nível, adicionar e remover ----
  var levels = document.querySelectorAll("[data-level]");
  if (levels.length) {
    var ICONS = {
      video: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
      file: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>'
    };
    var LABELS = { video: "Vídeo", info: "Informação", file: "Material" };
    var DEL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';

    function bindDelete(btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".content-item");
        if (item) item.remove();
      });
    }
    document.querySelectorAll("[data-del]").forEach(bindDelete);

    levels.forEach(function (level) {
      var head = level.querySelector("[data-toggle]");
      var form = level.querySelector("[data-form]");
      var list = level.querySelector("[data-list]");
      var urlField = form ? form.querySelector("[data-url]") : null;
      var typeLabel = form ? form.querySelector("[data-label]") : null;
      var current = "video";

      if (head) head.addEventListener("click", function () { level.classList.toggle("open"); });

      level.querySelectorAll("[data-add]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          current = btn.getAttribute("data-add");
          if (urlField) urlField.style.display = current === "video" ? "" : "none";
          if (typeLabel) typeLabel.textContent = "Título d" + (current === "info" ? "a informação" : current === "file" ? "o material" : "o vídeo");
          form.classList.add("open");
          var t = form.querySelector('[data-f="title"]'); if (t) t.focus();
        });
      });

      if (form) {
        var cancel = form.querySelector("[data-cancel]");
        if (cancel) cancel.addEventListener("click", function () { form.classList.remove("open"); form.reset(); });

        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var get = function (k) { var el = form.querySelector('[data-f="' + k + '"]'); return el ? el.value.trim() : ""; };
          var title = get("title"); if (!title) return;
          var meta = get("meta"), url = get("url"), desc = get("desc");
          var sub = LABELS[current];
          if (current === "video" && meta) sub = "Vídeo · " + meta;
          else if (meta) sub = sub + " · " + meta;
          if (desc) sub = sub + " — " + desc;

          var item = document.createElement("div");
          item.className = "content-item";
          item.innerHTML =
            '<span class="ci-ic ' + current + '">' + ICONS[current] + "</span>" +
            '<div class="ci-body"><div class="t"></div><div class="d"></div></div>' +
            '<button class="ci-del" aria-label="Remover">' + DEL + "</button>";
          item.querySelector(".t").textContent = (url ? "▶ " : "") + title;
          item.querySelector(".d").textContent = sub;
          bindDelete(item.querySelector(".ci-del"));
          list.appendChild(item);

          form.reset();
          form.classList.remove("open");
        });
      }
    });
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
      var termos = document.getElementById("termos");

      if (!nome || nome.split(" ").length < 2) return showMsg("Informe seu nome completo.", false);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showMsg("Digite um e-mail válido.", false);
      if (senha.length < 6) return showMsg("A senha deve ter pelo menos 6 caracteres.", false);
      if (senha !== senha2) return showMsg("As senhas não conferem.", false);
      if (termos && !termos.checked) return showMsg("É preciso aceitar os termos para continuar.", false);

      var consultores = [];
      try { consultores = JSON.parse(localStorage.getItem("tp_consultores") || "[]"); } catch (err) {}
      if (consultores.some(function (c) { return c.email === email; })) {
        return showMsg("Já existe um acesso com esse e-mail. Tente entrar.", false);
      }

      var conta = { nome: nome, email: email, telefone: telefone, criadoEm: new Date().toISOString() };
      consultores.push(conta);
      try {
        localStorage.setItem("tp_consultores", JSON.stringify(consultores));
        localStorage.setItem("tp_sessao", JSON.stringify({ nome: nome, email: email }));
      } catch (err) {}

      showMsg("Acesso criado com sucesso! Redirecionando para a plataforma…", true);
      cadastroForm.querySelector('button[type="submit"]').disabled = true;
      setTimeout(function () { window.location.href = "dashboard.html"; }, 1400);
    });
  }

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
