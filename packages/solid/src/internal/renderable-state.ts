import { type Accessor, from } from "solid-js";

interface StateSource<T> {
  subscribe(listener: (state: T) => void): () => void;
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
