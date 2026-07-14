import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
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
