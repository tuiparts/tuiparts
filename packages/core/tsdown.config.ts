import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/_internal/button.ts",
    "src/_internal/checkbox.ts",
    "src/_internal/switch.ts",
    "src/badge/index.ts",
    "src/button/index.ts",
    "src/checkbox/index.ts",
    "src/dialog/index.ts",
    "src/input/index.ts",
    "src/radio/index.ts",
    "src/switch/index.ts",
  ],
  format: "esm",
  dts: true,
  clean: true,
  deps: {
    neverBundle: ["@opentui/core"],
  },
  define: {
    __DEV__: 'process.env.NODE_ENV !== "production"',
  },
});
