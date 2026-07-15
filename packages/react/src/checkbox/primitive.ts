import { extend } from "@opentui/react";
import {
  type CheckboxIndicatorOptions,
  CheckboxIndicatorRenderable,
  type CheckboxRootOptions,
  CheckboxRootRenderable,
  type CheckboxState,
  CheckboxStore,
} from "@tuiparts/core/checkbox";
import {
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useContext,
} from "react";
import { useCoreStore } from "../internal/use-core-store";

const ROOT_TAG = "otui-checkbox-root";
const INDICATOR_TAG = "otui-checkbox-indicator";

extend({
  [ROOT_TAG]: CheckboxRootRenderable,
  [INDICATOR_TAG]: CheckboxIndicatorRenderable,
});

const CheckboxContext = createContext<CheckboxStore | null>(null);

type RootProps = Omit<CheckboxRootOptions, "store"> & {
  children?: ReactNode | ((state: CheckboxState) => ReactNode);
  ref?: Ref<CheckboxRootRenderable>;
};

type IndicatorProps = Omit<CheckboxIndicatorOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<CheckboxIndicatorRenderable>;
};

export function Root({ children, ...props }: Root.Props): ReactElement {
  const [store, state] = useCoreStore<CheckboxState, CheckboxStore>(
    () => new CheckboxStore(props),
  );
  const content = typeof children === "function" ? children(state) : children;

  return createElement(
    CheckboxContext.Provider,
    { value: store },
    createElement(ROOT_TAG, { ...props, store }, content),
  );
}

export function Indicator({
  children,
  ...props
}: Indicator.Props): ReactElement {
  const store = useContext(CheckboxContext);
  if (!store) {
    throw new Error("Checkbox.Indicator must be rendered inside Checkbox.Root");
  }
  return createElement(INDICATOR_TAG, { ...props, store }, children);
}

Root.displayName = "Checkbox.Root";
Indicator.displayName = "Checkbox.Indicator";

export namespace Root {
  export type Props = RootProps;
  export type State = CheckboxState;
}

export namespace Indicator {
  export type Props = IndicatorProps;
}
