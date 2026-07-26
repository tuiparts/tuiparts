import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type CheckboxChangeDetails,
  type CheckboxCheckedChangeHandler,
  type CheckboxIndicatorOptions,
  CheckboxIndicatorRenderable,
  type CheckboxRootOptions,
  CheckboxRootRenderable,
  type CheckboxState,
} from "@tuiparts/core/checkbox";
import {
  createComponent,
  createContext,
  createEffect,
  type Ref,
  splitProps,
  untrack,
  useContext,
} from "solid-js";
import { CheckboxGroupContext } from "../internal/checkbox-group-context";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";
import { createRenderableState } from "../internal/renderable-state";

const CheckboxContext = createContext<CheckboxRootRenderable>();

type RootProps = Omit<CheckboxRootOptions, "group" | "store"> & {
  children?: JSX.Element | ((state: CheckboxState) => JSX.Element);
  ref?: Ref<CheckboxRootRenderable>;
};

type IndicatorProps = Omit<CheckboxIndicatorOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<CheckboxIndicatorRenderable>;
};

/** Solid adapter for a standalone or grouped Checkbox Root. */
export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const group = useContext(CheckboxGroupContext);
  const [local, renderableProps] = splitProps(props, [
    "checked",
    "children",
    "defaultChecked",
    "disabled",
    "onCheckedChange",
    "ref",
    "value",
  ]);
  const element = new CheckboxRootRenderable(
    renderer,
    untrack(() => ({
      ...renderableProps,
      checked: local.checked,
      defaultChecked: local.defaultChecked,
      disabled: local.disabled,
      group,
      onCheckedChange: local.onCheckedChange,
      value: local.value,
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
    get tabbable() {
      return state().tabbable;
    },
  };
  createEffect(() => {
    element.checked = local.checked;
    element.disabled = local.disabled;
    element.onCheckedChange = local.onCheckedChange;
    element.value = local.value;
  });
  setRenderableRef(local.ref, element);

  return createComponent(CheckboxContext.Provider, {
    value: element,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadRenderableProps(element, () => ({ ...renderableProps, children }));
      return element;
    },
  });
}

/** Solid adapter for the passive Checkbox Indicator Part. */
export function Indicator(props: Indicator.Props): JSX.Element {
  const renderer = useRenderer();
  const root = useContext(CheckboxContext);
  if (!root) {
    throw new Error("Checkbox.Indicator must be rendered inside Checkbox.Root");
  }
  const [local, renderableProps] = splitProps(props, ["children", "ref"]);
  const element = new CheckboxIndicatorRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store: root.store })),
  );
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({
    ...renderableProps,
    children: local.children,
  }));
  return element;
}

/** Types scoped to Checkbox.Root. */
export namespace Root {
  export type Props = RootProps;
  export type State = CheckboxState;
  export type ChangeDetails = CheckboxChangeDetails;
  export type CheckedChangeHandler = CheckboxCheckedChangeHandler;
}

/** Types scoped to Checkbox.Indicator. */
export namespace Indicator {
  export type Props = IndicatorProps;
}
