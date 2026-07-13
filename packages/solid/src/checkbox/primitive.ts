import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type CheckboxIndicatorOptions,
  CheckboxIndicatorRenderable,
  type CheckboxRootOptions,
  CheckboxRootRenderable,
  type CheckboxState,
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

const CheckboxContext = createContext<CheckboxRootRenderable>();

export type CheckboxProps = CheckboxRootOptions & {
  children?: JSX.Element | ((state: CheckboxState) => JSX.Element);
  ref?: Ref<CheckboxRootRenderable>;
};

export type CheckboxIndicatorProps = Omit<CheckboxIndicatorOptions, "root"> & {
  children?: JSX.Element;
  ref?: Ref<CheckboxIndicatorRenderable>;
};

function CheckboxRoot(props: CheckboxProps): JSX.Element {
  const renderer = useRenderer();
  const [state, setState] = createSignal<CheckboxState>();
  const publicState: CheckboxState = {
    get checked() {
      return state()?.checked ?? props.checked ?? props.defaultChecked ?? false;
    },
    get disabled() {
      return state()?.disabled ?? props.disabled ?? false;
    },
    get focused() {
      return state()?.focused ?? false;
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
    untrack(() => ({
      ...initialProps,
      checked: local.checked,
      defaultChecked: local.defaultChecked,
      disabled: local.disabled,
      onCheckedChange: local.onCheckedChange,
    })),
  );
  setState(element.getState());
  createEffect(() => {
    element.checked = local.checked;
    element.disabled = local.disabled;
    element.onCheckedChange = local.onCheckedChange;
  });
  onCleanup(element.subscribe(setState));
  setRenderableRef(local.ref, element);

  return createComponent(CheckboxContext.Provider, {
    value: element,
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
  const root = useContext(CheckboxContext);
  if (!root) {
    throw new Error("Checkbox.Indicator must be rendered inside Checkbox.Root");
  }
  const [local, initialProps] = splitProps(props, ["children", "ref"]);
  const element = new CheckboxIndicatorRenderable(
    renderer,
    untrack(() => ({ ...initialProps, root })),
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
