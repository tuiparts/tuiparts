import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type CheckboxIndicatorOptions,
  CheckboxIndicatorRenderable,
  type CheckboxState,
  type CheckboxRootOptions,
  CheckboxRootRenderable,
  CheckboxStore,
} from "@opentui-ui/core/checkbox";
import {
  createComponent,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  type Ref,
  splitProps,
  untrack,
  useContext,
} from "solid-js";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";

const CheckboxContext = createContext<CheckboxStore>();

export type CheckboxProps = Omit<CheckboxRootOptions, "store"> & {
  children?: JSX.Element | ((state: CheckboxState) => JSX.Element);
  ref?: Ref<CheckboxRootRenderable>;
};

export type CheckboxIndicatorProps = Omit<CheckboxIndicatorOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<CheckboxIndicatorRenderable>;
};

function CheckboxRoot(props: CheckboxProps): JSX.Element {
  const renderer = useRenderer();
  const store = new CheckboxStore({
    checked: props.checked,
    defaultChecked: props.defaultChecked,
    disabled: props.disabled,
    onCheckedChange: props.onCheckedChange,
  });
  const [state, setState] = createSignal(store.state);
  const publicState: CheckboxState = {
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
  const [local, initialProps] = splitProps(props, [
    "checked",
    "children",
    "defaultChecked",
    "disabled",
    "onCheckedChange",
    "ref",
  ]);
  const element = new CheckboxRootRenderable(
    renderer,
    untrack(() => ({ ...initialProps, store })),
  );
  createEffect(() => {
    element.checked = local.checked;
    element.disabled = local.disabled;
    element.onCheckedChange = local.onCheckedChange;
  });
  onCleanup(store.subscribe(setState));
  setRenderableRef(local.ref, element);

  return createComponent(CheckboxContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadRenderableProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

function CheckboxIndicator(props: CheckboxIndicatorProps): JSX.Element {
  const renderer = useRenderer();
  const store = useContext(CheckboxContext);
  if (!store) {
    throw new Error("Checkbox.Indicator must be rendered inside Checkbox.Root");
  }
  const [local, initialProps] = splitProps(props, ["children", "ref"]);
  const element = new CheckboxIndicatorRenderable(
    renderer,
    untrack(() => ({ ...initialProps, store })),
  );
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({
    ...initialProps,
    children: local.children,
  }));
  return element;
}

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
} as const;
