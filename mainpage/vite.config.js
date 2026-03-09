import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      "alef.local.softalef.com",
      "carta.local.softalef.com",
      "tpv.local.softalef.com",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("/node_modules/")) return;

          if (
            id.includes("/node_modules/react/") ||
            id.endsWith("/node_modules/react/index.js") ||
            id.includes("/node_modules/react-dom/")
          ) {
            return "vendor-react";
          }

          if (id.includes("/node_modules/react-router")) {
            return "vendor-router";
          }

          if (id.includes("/node_modules/axios")) {
            return "vendor-axios";
          }

          return "vendor";
        },
      },
    },
  },
});