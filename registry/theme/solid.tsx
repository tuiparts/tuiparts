import { type Accessor, createSignal, onCleanup } from "solid-js";
import { type Tokens, theme } from "./theme";

/** Reactive accessor over the resolved theme snapshot. */
export function useTheme(): Accessor<Readonly<Tokens>> {
  const [tokens, setTokens] = createSignal(theme.get());
  onCleanup(theme.subscribe(() => setTokens(theme.get())));
  return tokens;
}
