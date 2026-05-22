import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: "#0A1A0F",
          900: "#111D14",
          800: "#17291C",
          700: "#213625",
          500: "#2C8B49",
          400: "#3DDB6A"
        }
      },
      fontFamily: {
        body: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(61, 219, 106, 0.16), 0 20px 60px rgba(0, 0, 0, 0.24)"
      }
    }
  },
  plugins: []
} satisfies Config;
