import { useSyncExternalStore } from "react";
import { type Tokens, theme } from "./theme";

/** Resolved theme snapshot; re-renders on theme and mode changes. */
export function useTheme(): Readonly<Tokens> {
  return useSyncExternalStore(theme.subscribe, theme.get);
}
