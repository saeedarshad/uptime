import type { Config } from "tailwindcss";

/** Alpha-safe channel token: `rgb(var(--x) / <alpha-value>)` keeps `/60`
 *  opacity utilities working while letting the value swap per theme. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- Semantic, theme-aware tokens (light ⇄ dark via CSS vars) ---
        // Neutrals + brand accents remap under `.dark` in globals.css.
        canvas: token("canvas"), // page background
        surface: token("surface"), // card / panel background
        "surface-2": token("surface-2"), // subtle raised (table headers, chips)
        content: token("content"), // primary text; alpha (/60, /[0.08]) = muted / hairline
        safety: token("safety"),
        ok: token("ok"),
        danger: token("danger"),
        warn: token("warn"),

        // --- Fixed dark-surface brand shades (identical in both themes) ---
        // Used for the sidebar, dark buttons, avatars — always dark.
        graphite: "#242B33",
        ink: "#12161B",
        night: "#1A2027",
        // Warm neutrals retained for print / legacy surfaces.
        paper: "#F4F4F0",
        fog: "#E9E9E1",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        // Soft, layered elevation tuned to the graphite ink color.
        card: "0 1px 2px rgba(18,22,27,0.04), 0 1px 3px rgba(18,22,27,0.05)",
        "card-hover":
          "0 2px 4px rgba(18,22,27,0.05), 0 8px 20px -6px rgba(18,22,27,0.12)",
        elevated: "0 12px 32px -12px rgba(18,22,27,0.28)",
        "inner-line": "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.25s ease-out both",
        shimmer: "shimmer 1.5s infinite",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(36,43,51,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(36,43,51,0.04) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
