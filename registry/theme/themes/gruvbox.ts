import type { ThemeDefinition } from "../components/ui/theme";

/** Gruvbox (dark and light hard-contrast pair); ported from the opencode TUI theme. */
export const gruvbox: ThemeDefinition = {
  tokens: {
    colors: {
      background: "#282828",
      surface: "#3C3836",
      foreground: "#EBDBB2",
      mutedForeground: "#928374",
      border: "#665C54",
      focus: "#8EC07C",
      primary: "#83A598",
      primaryForeground: "#282828",
      destructive: "#FB4934",
      destructiveForeground: "#282828",
      success: "#B8BB26",
      successForeground: "#282828",
      warning: "#FE8019",
      warningForeground: "#282828",
      disabled: "#3C3836",
      disabledForeground: "#7C6F64",
    },
  },
  light: {
    colors: {
      background: "#FBF1C7",
      surface: "#EBDBB2",
      foreground: "#3C3836",
      mutedForeground: "#7C6F64",
      border: "#BDAE93",
      focus: "#427B58",
      primary: "#076678",
      primaryForeground: "#FBF1C7",
      destructive: "#9D0006",
      destructiveForeground: "#FBF1C7",
      success: "#79740E",
      successForeground: "#FBF1C7",
      warning: "#AF3A03",
      warningForeground: "#FBF1C7",
      disabled: "#EBDBB2",
      disabledForeground: "#BDAE93",
    },
  },
};
