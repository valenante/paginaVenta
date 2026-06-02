import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import prerender from "@prerenderer/rollup-plugin";

const prerenderRoutes = [
  "/",
  "/verifactu",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/terminos",
];

export default defineConfig({
  plugins: [
    react(),
    prerender({
      routes: prerenderRoutes,
      renderer: "@prerenderer/renderer-puppeteer",
      rendererOptions: {
        maxConcurrentRoutes: 2,
        renderAfterTime: 4000,
      },
      postProcess(renderedRoute) {
        // Collapse whitespace & inject data-prerendered marker
        renderedRoute.html = renderedRoute.html.replace(
          /<\/head>/,
          '<meta name="prerendered" content="true"></head>'
        );
        return renderedRoute;
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      "alef.local.softalef.com",
      "carta.local.softalef.com",
      "tpv.local.softalef.com",
    ],
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});