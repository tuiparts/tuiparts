import type { ThemeDefinition } from "../components/ui/theme";

/** Truecolor tuiparts.sh brand palette; trades terminal-native color for exact fidelity. */
export const cobaltDeep: ThemeDefinition = {
  tokens: {
    colors: {
      background: "#0D1117",
      surface: "#161B22",
      foreground: "#E8E4D9",
      mutedForeground: "#A8A296",
      border: "#30363D",
      focus: "#FFC94D",
      primary: "#FFB000",
      primaryForeground: "#0D1117",
      destructive: "#E5484D",
      destructiveForeground: "#FBF8F0",
      success: "#3FB950",
      successForeground: "#0D1117",
      warning: "#D29922",
      warningForeground: "#0D1117",
      disabled: "#161B22",
      disabledForeground: "#6C675D",
    },
  },
  light: {
    colors: {
      background: "#F6F8FA",
      surface: "#EAEEF2",
      foreground: "#1F2328",
      mutedForeground: "#57606A",
      border: "#D0D7DE",
      primaryForeground: "#FFFFFF",
      primary: "#B58500",
      success: "#1A7F37",
      successForeground: "#FFFFFF",
      warning: "#9A6700",
      warningForeground: "#FFFFFF",
      disabled: "#EAEEF2",
      disabledForeground: "#8C959F",
    },
  },
};
