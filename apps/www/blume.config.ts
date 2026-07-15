import { defineConfig } from "blume";

export default defineConfig({
  title: "OpenTUI UI",
  description:
    "Composable, framework-neutral interaction primitives and editable UI recipes for OpenTUI. Package the difficult behavior. Copy the opinionated layer.",
  logo: {
    image: "/logo.svg",
    text: "OpenTUI UI",
  },

  // Docs mount at /docs; the site root is the custom landing page.
  basePath: "/docs",

  github: {
    owner: "msmps",
    repo: "opentui-ui",
    dir: "apps/www",
  },

  theme: {
    // Electric cobalt. theme.css refines this per-mode in OKLCH; this hex
    // keeps config-driven surfaces (OG images, etc.) on brand.
    accent: "#2D62E4",
    radius: "sm",
    mode: "system",
    fonts: {
      display: "space-grotesk",
      body: "inter",
      mono: "jetbrains-mono",
    },
    background: {
      // Cool graphite, matches --blume-background dark in theme.css.
      dark: "#14161B",
    },
  },

  markdown: {
    code: {
      icons: true,
    },
  },

  ai: {
    llmsTxt: true,
  },

  lastModified: true,

  deployment: {
    output: "static",
    // TODO: replace with the production domain once it exists.
    site: "https://opentui-ui.dev",
  },
});
