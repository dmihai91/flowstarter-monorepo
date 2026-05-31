import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served at the root of lebadusul.flowstarter.net (Caddy file_server). The
// editor lives under /editor + /api on the same host, so we keep this app's
// own bundles under /static to avoid colliding with /assets/storefront.jpg
// and the editor's paths.
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "static",
    emptyOutDir: true,
  },
});
