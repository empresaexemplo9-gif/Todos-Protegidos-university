import { createRoot } from "react-dom/client";
import "../app/globals.css";
import "./theme.css";
import App from "./App";

const container = document.getElementById("root");
if (!container) throw new Error("Elemento #root não encontrado.");
createRoot(container).render(<App />);

// PWA: registra o service worker (funciona em https e em http://localhost).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
