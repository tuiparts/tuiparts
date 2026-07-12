import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/styled.ts",
    "src/badge/index.tsx",
    "src/button/index.tsx",
    "src/checkbox/index.tsx",
    "src/input/index.tsx",
    "src/radio/index.tsx",
    "src/switch/index.tsx",
  ],
  format: "esm",
  dts: true,
  clean: true,
  deps: {
    neverBundle: [
      "@opentui/core",
      "@opentui/solid",
      "@opentui-ui/core",
      "@opentui-ui/styles",
      "solid-js",
    ],
  },
});
