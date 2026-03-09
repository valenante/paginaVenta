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
          // React core — never changes, maximizes browser cache hit
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // Router — changes independently of React
          if (id.includes("node_modules/react-router")) {
            return "vendor-router";
          }
          // HTTP + auth plumbing
          if (id.includes("node_modules/axios")) {
            return "vendor-axios";
          }
          // Real-time
          if (id.includes("node_modules/socket.io-client") || id.includes("node_modules/engine.io-client")) {
            return "vendor-socket";
          }
          // Charts (single library after migration)
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          // PDF generation — heavy, loaded only in export flows
          if (
            id.includes("node_modules/jspdf") ||
            id.includes("node_modules/pdfmake") ||
            id.includes("node_modules/html2canvas")
          ) {
            return "vendor-pdf";
          }
          // Drag-and-drop
          if (id.includes("node_modules/@hello-pangea")) {
            return "vendor-dnd";
          }
          // Remaining third-party
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
});
