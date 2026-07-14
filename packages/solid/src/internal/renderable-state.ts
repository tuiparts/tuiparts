import { type Accessor, from } from "solid-js";

interface StateSource<T> {
  subscribe(listener: (state: T) => void): () => void;
}

interface ToggleState {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly focused: boolean;
}

/** Adapts an immutable Core state subscription to a Solid accessor. */
export function createRenderableState<T>(
  source: StateSource<T>,
  initialState: T,
): Accessor<T> {
  const state = from<T | undefined>(
    (set) => source.subscribe(set),
    initialState,
  );
  return () => state() ?? initialState;
}

export function createToggleStateView(
  state: Accessor<ToggleState>,
): ToggleState {
  return {
    get checked() {
      return state().checked;
    },
    get disabled() {
      return state().disabled;
    },
    get focused() {
      return state().focused;
    },
  };
}
