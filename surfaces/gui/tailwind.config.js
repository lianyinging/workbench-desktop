/** Tailwind config — mirrors platform/ui-mocks/redesign.html so the app can use the mock's
 *  exact utility classes. Colors map to the CSS custom properties already defined in styles.css
 *  (so light/dark theming flows through one source of truth). */
// Tokens are hex CSS vars (shared with styles.css). Opacity modifiers (`bg-panel/70`) need a
// channel form: `color-mix` only works from Safari 16.2+, so the Tauri WKWebView on macOS 12
// (≈ Safari 15) dropped those declarations and the desktop UI looked washed-out vs Chrome.
// Prefer `rgb(var(--*-rgb) / a)` — supported since Safari 15 — with matching `--*-rgb` channels
// declared next to each hex token in styles.css.
const tok = (name) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `var(${name})`
    // Keep opacityValue as-is: slash modifiers pass "0.7"; plain utilities pass
    // `var(--tw-*-opacity)` (Number() would NaN those and blank the color in WKWebView).
    : `rgb(var(${name}-rgb) / ${opacityValue})`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: tok("--paper"),
        panel: tok("--panel"),
        canvas: tok("--canvas"),
        chrome: tok("--chrome"),
        sidebar: tok("--sidebar"),
        chromeHover: tok("--chrome-hover"),
        ink: tok("--ink"),
        muted: tok("--muted"),
        faint: tok("--faint"),
        line: tok("--line"),
        lineStrong: tok("--line-strong"),
        accent: tok("--accent"),
        accentSoft: tok("--accent-soft"),
        ok: tok("--ok"),
        okSoft: tok("--ok-soft"),
        okLine: tok("--ok-line"),
        warnInk: tok("--warn-ink"),
        warnSoft: tok("--warn-soft"),
        danger: tok("--danger"),
        dangerSoft: tok("--danger-soft"),
        tealInk: tok("--teal-ink"),
        tealSoft: tok("--teal-soft"),
        tealLine: tok("--teal-line"),
        solid: tok("--solid"),
        onSolid: tok("--on-solid"),
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Inter", "system-ui", "sans-serif"],
        mono: ["SF Mono", "JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: { xl2: "14px" },
      // UX-048: the six-size type scale as classes bound to the CSS tokens (styles.css),
      // so a scale change is one edit. Arbitrary text-[Npx] classes are retired.
      fontSize: {
        title: "var(--fs-title)",
        heading: "var(--fs-heading)",
        body: ["var(--fs-body)", { lineHeight: "var(--lh-body)" }],
        ui: "var(--fs-ui)",
        meta: "var(--fs-meta)",
        label: "var(--fs-label)",
      },
    },
  },
  plugins: [],
};
