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
