import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/themes.ts", "src/react.tsx", "src/solid.tsx"],
  format: "esm",
  dts: true,
  clean: true,
  deps: {
    neverBundle: [
      "@opentui/core",
      "@opentui/react",
      "@opentui/solid",
      "react",
      "solid-js",
    ],
  },
});
