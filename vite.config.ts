import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// App interno da Sona (SPA). O servidor local (server/index.mjs) serve o build
// da pasta dist e as APIs em /api. Em desenvolvimento, o Vite faz proxy de /api
// para o servidor Node (porta 4317).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4317",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
