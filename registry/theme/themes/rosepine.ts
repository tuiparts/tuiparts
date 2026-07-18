import type { ThemeDefinition } from "../components/ui/theme";

/** Rosé Pine (main dark, Dawn light); ported from the opencode TUI theme. */
export const rosePine: ThemeDefinition = {
  tokens: {
    colors: {
      background: "#191724",
      surface: "#26233A",
      foreground: "#E0DEF4",
      mutedForeground: "#6E6A86",
      border: "#403D52",
      focus: "#EBBCBA",
      primary: "#9CCFD8",
      primaryForeground: "#191724",
      destructive: "#EB6F92",
      destructiveForeground: "#191724",
      success: "#31748F",
      successForeground: "#E0DEF4",
      warning: "#F6C177",
      warningForeground: "#191724",
      disabled: "#1F1D2E",
      disabledForeground: "#524F67",
    },
  },
  light: {
    colors: {
      background: "#FAF4ED",
      surface: "#F2E9E1",
      foreground: "#575279",
      mutedForeground: "#9893A5",
      border: "#DFDAD9",
      focus: "#D7827E",
      primary: "#31748F",
      primaryForeground: "#FAF4ED",
      destructive: "#B4637A",
      destructiveForeground: "#FAF4ED",
      success: "#286983",
      successForeground: "#FAF4ED",
      warning: "#EA9D34",
      warningForeground: "#FAF4ED",
      disabled: "#F2E9E1",
      disabledForeground: "#CECACD",
    },
  },
};
