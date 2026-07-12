import { extend } from "@opentui/react";
import {
  type CheckboxIndicatorOptions,
  CheckboxIndicatorRenderable,
  type CheckboxPrimitiveState,
  type CheckboxRootOptions,
  CheckboxRootRenderable,
  CheckboxStore,
} from "@opentui-ui/core/checkbox";
import {
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";

const ROOT_TAG = "otui-checkbox-primitive-root";
const INDICATOR_TAG = "otui-checkbox-primitive-indicator";

extend({
  [ROOT_TAG]: CheckboxRootRenderable,
  [INDICATOR_TAG]: CheckboxIndicatorRenderable,
});

const CheckboxContext = createContext<CheckboxStore | null>(null);

export type CheckboxPrimitiveRootProps = Omit<CheckboxRootOptions, "store"> & {
  children?: ReactNode | ((state: CheckboxPrimitiveState) => ReactNode);
  ref?: Ref<CheckboxRootRenderable>;
};

export type CheckboxPrimitiveIndicatorProps = Omit<
  CheckboxIndicatorOptions,
  "store"
> & {
  children?: ReactNode;
  ref?: Ref<CheckboxIndicatorRenderable>;
};

function CheckboxRoot({
  children,
  ...props
}: CheckboxPrimitiveRootProps): ReactElement {
  const storeRef = useRef<CheckboxStore | null>(null);
  if (!storeRef.current) storeRef.current = new CheckboxStore(props);
  const store = storeRef.current;
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
  const content = typeof children === "function" ? children(state) : children;

  return createElement(
    CheckboxContext.Provider,
    { value: store },
    createElement(ROOT_TAG, { ...props, store }, content),
  );
}

function CheckboxIndicator({
  children,
  ...props
}: CheckboxPrimitiveIndicatorProps): ReactElement {
  const store = useContext(CheckboxContext);
  if (!store) {
    throw new Error(
      "CheckboxPrimitive.Indicator must be rendered inside CheckboxPrimitive.Root",
    );
  }
  return createElement(INDICATOR_TAG, { ...props, store }, children);
}

CheckboxRoot.displayName = "CheckboxPrimitive.Root";
CheckboxIndicator.displayName = "CheckboxPrimitive.Indicator";

export const CheckboxPrimitive = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
} as const;
