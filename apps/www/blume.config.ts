import { defineConfig } from "blume";

export default defineConfig({
  title: "tui.parts",
  description:
    "The primitive and recipe ecosystem for OpenTUI. Package the difficult behavior. Copy the opinionated layer.",
  logo: {
    image: "/logo.svg",
    text: "tui.parts",
  },

  // Docs mount at /docs; the site root is the custom landing page.
  basePath: "/docs",

  github: {
    owner: "tuiparts",
    repo: "tuiparts",
    dir: "apps/www",
  },

  theme: {
    // Brand amber (docs/brand/tokens.json). theme.css refines this per-mode
    // — full #FFB000 on graphite in dark, deepened for contrast on paper in
    // light. This hex keeps config-driven surfaces (OG images, etc.) on brand.
    accent: "#FFB000",
    radius: "sm",
    mode: "system",
    // The brand face is Commit Mono (not a Google font) — self-hosted via
    // @font-face in theme.css, which overrides all three role vars. Every
    // role here is the decreed fallback, IBM Plex Mono
    // (docs/brand/typography.md); Blume dedupes it to one hosted family.
    // There is no "off" switch — absent roles re-default to Inter/Inter
    // Tight, shipping families the single-face rule would never render.
    fonts: {
      display: "ibm-plex-mono",
      body: "ibm-plex-mono",
      mono: "ibm-plex-mono",
    },
    background: {
      // Brand graphite, matches --blume-background dark in theme.css.
      dark: "#0D1117",
    },
  },

  markdown: {
    code: {
      icons: true,
    },
    codeBlocks: {
      theme: {
        // Default github-light was tuned for white: its red (#d73a49) and
        // orange (#e36209) tokens fail WCAG AA on the warm-paper background
        // (axe-checked). The high-contrast variant clears it; github-dark
        // audits clean on brand graphite and stays.
        light: "github-light-high-contrast",
      },
    },
  },

  ai: {
    llmsTxt: true,
  },

  lastModified: true,

  deployment: {
    output: "static",
    // TODO: replace with the production domain once it exists.
    site: "https://tui.parts",
  },
});
