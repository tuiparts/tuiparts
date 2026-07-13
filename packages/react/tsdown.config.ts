import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/styled.ts",
    "src/button/index.tsx",
    "src/checkbox/index.tsx",
    "src/dialog/index.ts",
    "src/input/index.tsx",
    "src/radio/index.tsx",
    "src/radio-group/index.tsx",
    "src/switch/index.tsx",
  ],
  format: "esm",
  dts: true,
  clean: true,
  deps: {
    neverBundle: [
      "@opentui/core",
      "@opentui/react",
      "@opentui-ui/core",
      "@opentui-ui/styles",
      "react",
    ],
  },
});
