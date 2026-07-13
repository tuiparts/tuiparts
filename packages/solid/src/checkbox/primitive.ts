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
  type Ref,
  splitProps,
  untrack,
  useContext,
} from "solid-js";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";
import { createRenderableState } from "../internal/renderable-state";

const CheckboxContext = createContext<CheckboxRootRenderable>();

type RootProps = CheckboxRootOptions & {
  children?: JSX.Element | ((state: CheckboxState) => JSX.Element);
  ref?: Ref<CheckboxRootRenderable>;
};

type IndicatorProps = Omit<CheckboxIndicatorOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<CheckboxIndicatorRenderable>;
};

export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
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
  const state = createRenderableState(element, element.getState());
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
  createEffect(() => {
    element.checked = local.checked;
    element.disabled = local.disabled;
    element.onCheckedChange = local.onCheckedChange;
  });
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

export function Indicator(props: Indicator.Props): JSX.Element {
  const renderer = useRenderer();
  const root = useContext(CheckboxContext);
  if (!root) {
    throw new Error("Checkbox.Indicator must be rendered inside Checkbox.Root");
  }
  const [local, initialProps] = splitProps(props, ["children", "ref"]);
  const element = new CheckboxIndicatorRenderable(
    renderer,
    untrack(() => ({ ...initialProps, store: root.store })),
  );
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({
    ...initialProps,
    children: local.children,
  }));
  return element;
}

export namespace Root {
  export type Props = RootProps;
  export type State = CheckboxState;
}

export namespace Indicator {
  export type Props = IndicatorProps;
}
