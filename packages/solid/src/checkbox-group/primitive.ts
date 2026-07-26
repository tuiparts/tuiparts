import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type CheckboxGroupChangeDetails,
  type CheckboxGroupOptions,
  type CheckboxGroupOrientation,
  CheckboxGroupRenderable,
  type CheckboxGroupState,
  CheckboxGroupStore,
  type CheckboxGroupValueChangeHandler,
} from "@tuiparts/core/checkbox-group";
import {
  createComponent,
  createEffect,
  type Ref,
  splitProps,
  untrack,
} from "solid-js";
import { CheckboxGroupContext } from "../internal/checkbox-group-context";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";
import { createRenderableState } from "../internal/renderable-state";

type CheckboxGroupProps = Omit<CheckboxGroupOptions, "store"> & {
  children?: JSX.Element | ((state: CheckboxGroupState) => JSX.Element);
  ref?: Ref<CheckboxGroupRenderable>;
};

/** Solid adapter for CheckboxGroup selection and collection ownership. */
export function CheckboxGroup(props: CheckboxGroup.Props): JSX.Element {
  const renderer = useRenderer();
  const store = new CheckboxGroupStore({
    defaultValue: props.defaultValue,
    disabled: props.disabled,
    loopFocus: props.loopFocus,
    onValueChange: props.onValueChange,
    orientation: props.orientation,
    value: props.value,
  });
  const state = createRenderableState(store, store.state);
  const publicState: CheckboxGroupState = {
    get disabled() {
      return state().disabled;
    },
    get orientation() {
      return state().orientation;
    },
    get value() {
      return state().value;
    },
  };
  const [local, renderableProps] = splitProps(props, [
    "children",
    "defaultValue",
    "disabled",
    "loopFocus",
    "onValueChange",
    "orientation",
    "ref",
    "value",
  ]);
  const element = new CheckboxGroupRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  createEffect(() => {
    element.disabled = local.disabled;
    element.loopFocus = local.loopFocus;
    element.onValueChange = local.onValueChange;
    element.orientation = local.orientation;
    element.value = local.value;
  });
  setRenderableRef(local.ref, element);

  return createComponent(CheckboxGroupContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadRenderableProps(element, () => ({ ...renderableProps, children }));
      return element;
    },
  });
}

/** Types scoped to the Solid CheckboxGroup component. */
export namespace CheckboxGroup {
  export type Props = CheckboxGroupProps;
  export type State = CheckboxGroupState;
  export type ChangeDetails = CheckboxGroupChangeDetails;
  export type Orientation = CheckboxGroupOrientation;
  export type ValueChangeHandler = CheckboxGroupValueChangeHandler;
}
