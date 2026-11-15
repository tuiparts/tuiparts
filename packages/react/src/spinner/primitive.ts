import { extend } from "@opentui/react";
import {
  type SpinnerFrameChangeDetails,
  type SpinnerFrameChangeHandler,
  type SpinnerIndicatorOptions,
  SpinnerIndicatorRenderable,
  type SpinnerLabelOptions,
  SpinnerLabelRenderable,
  type SpinnerPreset,
  type SpinnerRootOptions,
  SpinnerRootRenderable,
  type SpinnerState,
  SpinnerStore,
} from "@tuiparts/core/spinner";
import {
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useContext,
  useSyncExternalStore,
} from "react";
import { useCoreStore } from "../internal/use-core-store";

const tags = {
  root: "otui-spinner-root",
  indicator: "otui-spinner-indicator",
  label: "otui-spinner-label",
} as const;

extend({
  [tags.root]: SpinnerRootRenderable,
  [tags.indicator]: SpinnerIndicatorRenderable,
  [tags.label]: SpinnerLabelRenderable,
});

const StoreContext = createContext<SpinnerStore | null>(null);

function useStore(part: string): SpinnerStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(`Spinner.${part} must be rendered inside Spinner.Root`);
  }
  return store;
}

type RootProps = Omit<SpinnerRootOptions, "store"> & {
  children?: ReactNode | ((state: SpinnerState) => ReactNode);
  ref?: Ref<SpinnerRootRenderable>;
};

type IndicatorProps = Omit<SpinnerIndicatorOptions, "store"> & {
  children?: ReactNode | ((currentFrame: string) => ReactNode);
  ref?: Ref<SpinnerIndicatorRenderable>;
};

type LabelProps = SpinnerLabelOptions & {
  children?: ReactNode;
  ref?: Ref<SpinnerLabelRenderable>;
};

/** React Spinner Root adapter. */
export function Root({ children, ref, ...props }: Root.Props): ReactElement {
  const [store, state] = useCoreStore<SpinnerState, SpinnerStore>(
    () => new SpinnerStore(props),
  );

  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    StoreContext.Provider,
    { value: store },
    createElement(tags.root, { ...props, ref, store }, content),
  );
}

/** React Spinner Indicator adapter. */
export function Indicator({
  children,
  ref,
  ...props
}: Indicator.Props): ReactElement {
  const store = useStore("Indicator");
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
  const content =
    typeof children === "function" ? children(state.currentFrame) : children;
  return createElement(tags.indicator, { ...props, ref, store }, content);
}

/** React Spinner Label adapter. */
export function Label({ children, ref, ...props }: Label.Props): ReactElement {
  return createElement(tags.label, { ...props, ref }, children);
}

Root.displayName = "Spinner.Root";
Indicator.displayName = "Spinner.Indicator";
Label.displayName = "Spinner.Label";

export namespace Root {
  export type Props = RootProps;
  export type State = SpinnerState;
  export type Preset = SpinnerPreset;
  export type ChangeDetails = SpinnerFrameChangeDetails;
  export type FrameChangeHandler = SpinnerFrameChangeHandler;
}

export namespace Indicator {
  export type Props = IndicatorProps;
}

export namespace Label {
  export type Props = LabelProps;
}
