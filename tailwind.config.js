/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        surface2: token("surface-2"),
        fg: token("fg"),
        muted: token("muted"),
        line: token("line"),
        accent: token("accent"),
        accentfg: token("accent-fg"),
        accentsoft: token("accent-soft"),
        warn: token("warn"),
        info: token("info"),
        danger: token("danger"),
        gold: token("gold"),
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Segoe UI"', "system-ui", "sans-serif"],
        sans: ["Figtree", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
