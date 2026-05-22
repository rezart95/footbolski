import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["manifest.json"],
      manifest: {
        name: "Pitchup",
        short_name: "Pitchup",
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
