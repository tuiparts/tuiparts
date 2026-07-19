import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/button/index.tsx",
    "src/checkbox/index.tsx",
    "src/dialog/index.ts",
    "src/input/index.tsx",
    "src/radio/index.tsx",
    "src/radio-group/index.tsx",
    "src/switch/index.tsx",
    "src/tabs/index.ts",
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
