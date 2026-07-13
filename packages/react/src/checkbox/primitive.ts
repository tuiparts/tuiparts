import { extend } from "@opentui/react";
import {
  type CheckboxIndicatorOptions,
  CheckboxIndicatorRenderable,
  type CheckboxState,
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

const ROOT_TAG = "otui-checkbox-root";
const INDICATOR_TAG = "otui-checkbox-indicator";

extend({
  [ROOT_TAG]: CheckboxRootRenderable,
  [INDICATOR_TAG]: CheckboxIndicatorRenderable,
});

const CheckboxContext = createContext<CheckboxStore | null>(null);

export type CheckboxProps = Omit<CheckboxRootOptions, "store"> & {
  children?: ReactNode | ((state: CheckboxState) => ReactNode);
  ref?: Ref<CheckboxRootRenderable>;
};

export type CheckboxIndicatorProps = Omit<CheckboxIndicatorOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<CheckboxIndicatorRenderable>;
};

function CheckboxRoot({ children, ...props }: CheckboxProps): ReactElement {
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
}: CheckboxIndicatorProps): ReactElement {
  const store = useContext(CheckboxContext);
  if (!store) {
    throw new Error("Checkbox.Indicator must be rendered inside Checkbox.Root");
  }
  return createElement(INDICATOR_TAG, { ...props, store }, children);
}

CheckboxRoot.displayName = "Checkbox.Root";
CheckboxIndicator.displayName = "Checkbox.Indicator";

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
} as const;
