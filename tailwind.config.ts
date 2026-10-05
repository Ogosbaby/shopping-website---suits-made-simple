import type { Config } from "tailwindcss";

/**
 * Brand palette sampled from the Suits Made Simple logo:
 * deep slate blue (#3B4654) with white type and warm paper neutrals.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#3B4654",
          dark: "#2C3541",
          deeper: "#212832",
          light: "rgb(var(--color-text-light) / <alpha-value>)",
          soft: "rgb(var(--color-text-soft) / <alpha-value>)",
        },
        mist: "rgb(var(--color-bg-mist) / <alpha-value>)",
        paper: "rgb(var(--color-bg-paper) / <alpha-value>)",
        surface: "rgb(var(--color-bg-surface) / <alpha-value>)",
        taupe: {
          DEFAULT: "#C3BCB1",
          light: "#D9D3C9",
          dark: "#A49D93",
        },
        line: "rgb(var(--color-border-line) / <alpha-value>)",
        ink: "rgb(var(--color-text-ink) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        brand: "0.32em",
      },
      maxWidth: {
        shell: "76rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(36, 43, 52, 0.04), 0 12px 32px -18px rgba(36, 43, 52, 0.22)",
        lift: "0 2px 4px rgba(36, 43, 52, 0.06), 0 24px 48px -20px rgba(36, 43, 52, 0.3)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
