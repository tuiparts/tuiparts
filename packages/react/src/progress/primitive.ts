import { extend } from "@opentui/react";
import {
  type ProgressIndicatorOptions,
  ProgressIndicatorRenderable,
  type ProgressRootOptions,
  ProgressRootRenderable,
  type ProgressState,
  ProgressStore,
  type ProgressValueChangeHandler,
} from "@tuiparts/core/progress";
import {
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { useCoreStore } from "../internal/use-core-store";

const tags = {
  indicator: "otui-progress-indicator",
  root: "otui-progress-root",
} as const;

extend({
  [tags.indicator]: ProgressIndicatorRenderable,
  [tags.root]: ProgressRootRenderable,
});

const StoreContext = createContext<ProgressStore | null>(null);

type RootProps = Omit<ProgressRootOptions, "store"> & {
  children?: ReactNode | ((state: ProgressState) => ReactNode);
  ref?: Ref<ProgressRootRenderable>;
};

type IndicatorProps = Omit<ProgressIndicatorOptions, "store"> & {
  children?: ReactNode | ((state: ProgressState) => ReactNode);
  ref?: Ref<ProgressIndicatorRenderable>;
};

function useStore(part: string): ProgressStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(`Progress.${part} must be rendered inside Progress.Root`);
  }
  return store;
}

/** React Progress Root adapter. */
export function Root({
  children,
  defaultValue,
  max,
  onValueChange,
  value,
  ...props
}: Root.Props): ReactElement {
  const [store, state] = useCoreStore<ProgressState, ProgressStore>(
    () => new ProgressStore({ defaultValue, max, onValueChange, value }),
  );

  useEffect(() => {
    store.setControlledValue(value);
  }, [store, value]);

  useEffect(() => {
    if (max !== undefined) store.setMax(max);
  }, [store, max]);

  useEffect(() => {
    store.setOnValueChange(onValueChange);
  }, [store, onValueChange]);

  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    StoreContext.Provider,
    { value: store },
    createElement(tags.root, { ...props, max, store, value }, content),
  );
}

Root.displayName = "Progress.Root";

/** React Progress Indicator adapter. */
export function Indicator({
  children,
  ...props
}: IndicatorProps): ReactElement {
  const store = useStore("Indicator");
  const state = useSyncExternalStore(
    (onStoreChange) => store.subscribe(onStoreChange),
    () => store.state,
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(tags.indicator, { ...props, store }, content);
}

Indicator.displayName = "Progress.Indicator";

export namespace Root {
  export type Props = RootProps;
  export type State = ProgressState;
}

export namespace Indicator {
  export type Props = IndicatorProps;
  export type State = ProgressState;
}

export type State = ProgressState;
export type ValueChangeHandler = ProgressValueChangeHandler;
