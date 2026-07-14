import { useRef, useSyncExternalStore } from "react";

interface CoreStore<State> {
  readonly state: State;
  subscribe(listener: () => void): () => void;
}

export function useCoreStore<State, Store extends CoreStore<State>>(
  createStore: () => Store,
): readonly [store: Store, state: State] {
  const storeRef = useRef<Store | null>(null);
  if (!storeRef.current) storeRef.current = createStore();
  const store = storeRef.current;
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
  return [store, state];
}
