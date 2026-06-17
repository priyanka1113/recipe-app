import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

function serviceWorkerPlugin(): Plugin {
  const swSource = () => readFileSync(resolve(rootDir, "src/sw.js"), "utf-8");

  return {
    name: "recipe-sw-plugin",
    configureServer(server) {
      server.middlewares.use("/sw.js", (_req, res) => {
        res.setHeader("Content-Type", "application/javascript");
        res.end(swSource().replace("__BUILD_ASSETS__", "[]"));
      });
    },
    generateBundle(_options, bundle) {
      const buildAssets = Object.keys(bundle)
        .filter((fileName) => /\.(js|css)$/.test(fileName))
        .map((fileName) => `/${fileName}`);

      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: swSource().replace("__BUILD_ASSETS__", JSON.stringify(buildAssets)),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorkerPlugin()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5174",
    },
  },
});
