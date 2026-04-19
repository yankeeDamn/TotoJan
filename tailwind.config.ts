import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f9f5ef",
          100: "#f0e6d7",
          200: "#e4cfb0",
          300: "#d6b285",
          400: "#c68f56",
          500: "#b67635",
          600: "#975d28",
          700: "#7a4821",
          800: "#61381d",
          900: "#4b2e1b"
        },
        accent: {
          50: "#f3faf8",
          100: "#d7f1e9",
          200: "#aee3d1",
          300: "#7ecfb3",
          400: "#4bad8e",
          500: "#2f9477",
          600: "#21745d",
          700: "#1b5c4c",
          800: "#18493d",
          900: "#143c33"
        },
        ink: "#1d2433",
        sand: "#fff9f2"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(29, 36, 51, 0.12)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      fontFamily: {
        sans: ["var(--font-family)", "ui-sans-serif", "system-ui"]
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at 1px 1px, rgba(28, 52, 84, 0.08) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;