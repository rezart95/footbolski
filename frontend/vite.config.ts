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
      // Register the service worker in `npm run dev` too, so the install
      // prompt (which requires an active SW) can be tested locally.
      devOptions: {
        enabled: true,
        type: "module"
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest}"]
      },
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "Footbolski",
        short_name: "Footbolski",
        description: "Football scheduling, team splitting, and payments for our group.",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait",
        categories: ["sports", "lifestyle"],
        background_color: "#0A1A0F",
        theme_color: "#0A1A0F",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      }
    })
  ],
  server: {
    port: 5174,
    strictPort: true
  }
});
