import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {

    // ── Proxy SOLO DE DESARROLLO hacia la API de produccion ────────────────────
    // Permite probar el frontend local contra datos reales sin desplegar.
    // Hace falta un proxy (y no basta apuntar la URL) porque en produccion la cookie
    // de sesion sale con `domain: ".softalef.com"` — un navegador servido desde
    // localhost no puede guardarla. `cookieDomainRewrite` se lo quita.
    // CSRF: no se falsea nada; csrf.js:14 ya admite cualquier origen http://localhost.
    // ⚠️ Esto habla con la API que sirve a CLIENTES REALES.
    proxy: {
      "/api": {
        target: "https://api.softalef.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "",
      },
      "/socket.io": {
        target: "https://api.softalef.com",
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
    host: true,
    port: 5176,
    allowedHosts: [
      "alef.local.softalef.com",
      "carta.local.softalef.com",
      "tpv.local.softalef.com",
    ],
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
  // Tests de componente (mismo montaje que el TPV: tpv/vite.config.js:81-85).
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/tests/setup.js",
  },
});