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
          if (id.includes("/node_modules/react") || id.includes("/node_modules/react-dom")) {
            return "vendor-react";
          }

          if (id.includes("/node_modules/react-router")) {
            return "vendor-router";
          }

          if (id.includes("/node_modules/axios")) {
            return "vendor-axios";
          }

          if (
            id.includes("/node_modules/socket.io-client") ||
            id.includes("/node_modules/engine.io-client")
          ) {
            return "vendor-socket";
          }

          if (
            id.includes("/node_modules/jspdf") ||
            id.includes("/node_modules/pdfmake") ||
            id.includes("/node_modules/html2canvas")
          ) {
            return "vendor-pdf";
          }

          if (id.includes("/node_modules/@hello-pangea")) {
            return "vendor-dnd";
          }

          if (id.includes("/node_modules/")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
});