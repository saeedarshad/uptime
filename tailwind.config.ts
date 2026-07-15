import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#242B33",
        paper: "#F4F4F0",
        safety: "#E1622F",
        ok: "#2E7D5B",
        danger: "#BE4432",
        warn: "#B07C1F",
        // Deeper graphite shades for the navigation / dark surfaces.
        ink: "#12161B",
        night: "#1A2027",
        // Warm neutral used at the edges of the paper background.
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
