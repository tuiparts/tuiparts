import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/badge/index.ts",
    "src/button/index.ts",
    "src/checkbox/index.ts",
    "src/dialog/index.ts",
    "src/input/index.ts",
    "src/radio/index.ts",
    "src/radio-group/index.ts",
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
