import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: "auto",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest}"]
      },
      includeAssets: ["manifest.json"],
      manifest: {
        name: "Footbolski",
        short_name: "Footbolski",
        display: "standalone",
        start_url: "/",
        background_color: "#0A1A0F",
        theme_color: "#0A1A0F"
      }
    })
  ],
  server: {
    port: 5174,
    strictPort: true
  }
});
