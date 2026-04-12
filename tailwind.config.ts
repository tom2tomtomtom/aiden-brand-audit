import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "black-ink": "#050505",
        "black-deep": "#0a0a0a",
        "black-card": "#0f0f0f",
        "red-hot": "#ff2e2e",
        "red-dim": "#cc2525",
        "orange-accent": "#ff6b00",
        "yellow-electric": "#ffeb3b",
        "white-full": "#ffffff",
        "white-muted": "rgba(255, 255, 255, 0.6)",
        "white-dim": "rgba(255, 255, 255, 0.4)",
        "white-faint": "rgba(255, 255, 255, 0.1)",
        "grid-lines": "rgba(255, 255, 255, 0.02)",
        "border-subtle": "rgba(255, 255, 255, 0.1)",
        "border-strong": "rgba(255, 46, 46, 0.3)",
      },
      fontFamily: {
        "geist-sans": ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        "geist-mono": ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular"],
      },
      borderRadius: {
        none: "0",
        DEFAULT: "0",
      },
    },
  },
  plugins: [],
};
export default config;
