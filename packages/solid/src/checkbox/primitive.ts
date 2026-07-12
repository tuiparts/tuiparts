import type { JSX } from "@opentui/solid";
import { createElement, extend, spread } from "@opentui/solid";
import {
  type CheckboxIndicatorOptions,
  CheckboxIndicatorRenderable,
  type CheckboxPrimitiveState,
  type CheckboxRootOptions,
  CheckboxRootRenderable,
  CheckboxStore,
} from "@opentui-ui/core/checkbox";
import {
  createComponent,
  createContext,
  createSignal,
  onCleanup,
  type Ref,
  Show,
  useContext,
} from "solid-js";

const ROOT_TAG = "otui-checkbox-primitive-root";
const INDICATOR_TAG = "otui-checkbox-primitive-indicator";

extend({
  [ROOT_TAG]: CheckboxRootRenderable,
  [INDICATOR_TAG]: CheckboxIndicatorRenderable,
});

const CheckboxContext = createContext<CheckboxStore>();

export type CheckboxPrimitiveRootProps = Omit<CheckboxRootOptions, "store"> & {
  children?: JSX.Element | ((state: CheckboxPrimitiveState) => JSX.Element);
  ref?: Ref<CheckboxRootRenderable>;
};

export type CheckboxPrimitiveIndicatorProps = Omit<
  CheckboxIndicatorOptions,
  "store"
> & {
  children?: JSX.Element;
  keepMounted?: boolean;
  ref?: Ref<CheckboxIndicatorRenderable>;
};

function CheckboxRoot(props: CheckboxPrimitiveRootProps): JSX.Element {
  const store = new CheckboxStore(props);
  const [state, setState] = createSignal(store.state);
  onCleanup(store.subscribe(setState));

  return createComponent(CheckboxContext.Provider, {
    value: store,
    get children() {
      const element = createElement(ROOT_TAG);
      spread(element, () => ({
        ...props,
        children:
          typeof props.children === "function"
            ? props.children(state())
            : props.children,
        store,
      }));
      return element;
    },
  });
}

function CheckboxIndicator(
  props: CheckboxPrimitiveIndicatorProps,
): JSX.Element {
  const store = useContext(CheckboxContext);
  if (!store) {
    throw new Error(
      "CheckboxPrimitive.Indicator must be rendered inside CheckboxPrimitive.Root",
    );
  }
  const [state, setState] = createSignal(store.state);
  onCleanup(store.subscribe(setState));

  return createComponent(Show, {
    keyed: true,
    get when() {
      return props.keepMounted || state().checked;
    },
    get children() {
      const element = createElement(INDICATOR_TAG);
      spread(element, () => {
        const { keepMounted: _, ...indicatorProps } = props;
        return { ...indicatorProps, store };
      });
      return element;
    },
  });
}

export const CheckboxPrimitive = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
} as const;
