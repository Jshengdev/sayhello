import type { Config } from "tailwindcss";

/**
 * Tokens live once in app/globals.css (:root) — the sayhello paper-light world
 * (docs/DESIGN.md, ported from said-built / cofounder-dna). Tailwind only references them.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--page)",
        raised: "var(--raised)",
        canvas: "var(--canvas)",
        recessed: "var(--recessed)",
        // ONE ink (#262323) at alpha steps does ALL the text work
        ink: "var(--ink-90)",
        "ink-2": "var(--ink-70)",
        mute: "var(--ink-50)",
        faint: "var(--ink-35)",
        hair: "var(--ink-10)",
        "hair-soft": "var(--ink-6)",
        // ONE accent — only on the executing node
        live: "var(--live)",
        // status — low-chroma, readable on paper
        good: "var(--good)",
        warn: "var(--warn)",
        bad: "var(--bad)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        numeral: ["var(--font-numeral)", "monospace"],
      },
      transitionTimingFunction: {
        signature: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
