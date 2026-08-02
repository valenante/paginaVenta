// Configuración de tests del panel.
//
// Deliberadamente SEPARADA de vite.config.js para no tocar la config de build
// de producción (que hace `drop: ["console","debugger"]` y define allowedHosts).
// Vitest da prioridad a este fichero sobre vite.config.js.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
  },
});
