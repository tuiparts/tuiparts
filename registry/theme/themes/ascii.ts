import type { ThemeDefinition } from "../components/ui/theme";

/** ASCII-only glyphs for fonts and terminals without Unicode coverage. */
export const ascii: ThemeDefinition = {
  tokens: {
    glyphs: {
      check: "x",
      radio: "*",
      thumb: "*",
      track: "-",
    },
  },
};
