import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import brand from "../../brand.json";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;
const basePath = process.env.BASE_PATH ?? '/';

// brand.json drives the page <head> and the --brand-* CSS variables, so a new
// brand edits that one file instead of hunting hex codes and titles.
const kebab = (k: string) => k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
function brandPlugin() {
  const vars = Object.entries(brand.colors).map(([k, v]) => `--${kebab(k)}:${v}`).join(';');
  return {
    name: "brand",
    transformIndexHtml(html: string) {
      return html
        .replaceAll("%BRAND_NAME%", brand.name)
        .replaceAll("%BRAND_SITE_TITLE%", brand.siteTitle)
        .replaceAll("%BRAND_SHARE_TITLE%", brand.shareTitle)
        .replaceAll("%BRAND_DESCRIPTION%", brand.description)
        .replaceAll("%BRAND_COLOR%", brand.colors.brand)
        .replace("</head>", `  <style>:root{${vars}}</style>
  </head>`);
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    brandPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.API_PORT ?? 8080}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
