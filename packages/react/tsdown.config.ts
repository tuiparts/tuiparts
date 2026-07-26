import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/accordion/index.ts",
    "src/button/index.tsx",
    "src/checkbox/index.tsx",
    "src/checkbox-group/index.ts",
    "src/collapsible/index.ts",
    "src/dialog/index.ts",
    "src/input/index.tsx",
    "src/number-field/index.ts",
    "src/radio/index.tsx",
    "src/radio-group/index.tsx",
    "src/switch/index.tsx",
    "src/tabs/index.ts",
    "src/textarea/index.tsx",
    "src/toggle/index.tsx",
    "src/toggle-group/index.tsx",
  ],
  format: "esm",
  dts: true,
  clean: true,
  deps: {
    neverBundle: ["@opentui/core", "@opentui/react", "@tuiparts/core", "react"],
  },
});
