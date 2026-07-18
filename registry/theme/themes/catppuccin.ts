import type { ThemeDefinition } from "../components/ui/theme";

/** Catppuccin (Mocha dark, Latte light); ported from the opencode TUI theme. */
export const catppuccin: ThemeDefinition = {
  tokens: {
    colors: {
      background: "#1E1E2E",
      surface: "#313244",
      foreground: "#CDD6F4",
      mutedForeground: "#9399B2",
      border: "#45475A",
      focus: "#F5C2E7",
      primary: "#89B4FA",
      primaryForeground: "#1E1E2E",
      destructive: "#F38BA8",
      destructiveForeground: "#1E1E2E",
      success: "#A6E3A1",
      successForeground: "#1E1E2E",
      warning: "#F9E2AF",
      warningForeground: "#1E1E2E",
      disabled: "#181825",
      disabledForeground: "#585B70",
    },
  },
  light: {
    colors: {
      background: "#EFF1F5",
      surface: "#CCD0DA",
      foreground: "#4C4F69",
      mutedForeground: "#7C7F93",
      border: "#BCC0CC",
      focus: "#EA76CB",
      primary: "#1E66F5",
      primaryForeground: "#FFFFFF",
      destructive: "#D20F39",
      destructiveForeground: "#FFFFFF",
      success: "#40A02B",
      successForeground: "#FFFFFF",
      warning: "#DF8E1D",
      warningForeground: "#FFFFFF",
      disabled: "#E6E9EF",
      disabledForeground: "#ACB0BE",
    },
  },
};
