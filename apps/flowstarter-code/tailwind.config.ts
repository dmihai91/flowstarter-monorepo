import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    // Include design system components so their Tailwind classes aren't purged
    "../../packages/flow-design-system/src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand palette — matches main platform
        brand: {
          purple: "#4338CA",
          violet: "#8B5CF6",
          accent: "#4D5DD9",
        },
        // Figma design tokens (mirrors flowstarter-main)
        "ui-bg": {
          base:     "var(--ui-bg-base)",
          subtle:   "var(--ui-bg-subtle)",
          elevated: "var(--ui-bg-elevated)",
        },
        "ui-border": {
          base:  "var(--ui-border-base)",
          strong: "var(--ui-border-strong)",
          focus: "var(--ui-border-focus)",
        },
        "ui-text": {
          primary:   "var(--ui-text-primary)",
          secondary: "var(--ui-text-secondary)",
          tertiary:  "var(--ui-text-tertiary)",
        },
        "ui-accent": {
          purple: "var(--ui-accent-purple)",
          blue:   "var(--ui-accent-blue)",
          green:  "var(--ui-accent-green)",
          orange: "var(--ui-accent-orange)",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["Roboto Mono", "ui-monospace", "monospace"],
      },
      keyframes: {
        "flow-drift-1": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-10px) translateX(15px)" },
        },
        "flow-drift-2": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(8px) translateX(-12px)" },
        },
      },
      animation: {
        "flow-drift-1": "flow-drift-1 20s ease-in-out infinite",
        "flow-drift-2": "flow-drift-2 25s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
