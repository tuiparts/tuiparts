import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type ToggleGroupChangeDetails,
  type ToggleGroupOptions,
  type ToggleGroupOrientation,
  ToggleGroupRenderable,
  type ToggleGroupState,
  ToggleGroupStore,
  type ToggleGroupValueChangeHandler,
} from "@tuiparts/core/toggle-group";
import {
  createComponent,
  createEffect,
  type Ref,
  splitProps,
  untrack,
} from "solid-js";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";
import { createRenderableState } from "../internal/renderable-state";
import { ToggleGroupContext } from "../toggle/primitive";

type ToggleGroupProps = Omit<ToggleGroupOptions, "store"> & {
  children?: JSX.Element | ((state: ToggleGroupState) => JSX.Element);
  ref?: Ref<ToggleGroupRenderable>;
};

/** Solid adapter for ToggleGroup selection and collection ownership. */
export function ToggleGroup(props: ToggleGroup.Props): JSX.Element {
  const renderer = useRenderer();
  const store = new ToggleGroupStore({
    defaultValue: props.defaultValue,
    disabled: props.disabled,
    loopFocus: props.loopFocus,
    multiple: props.multiple,
    onValueChange: props.onValueChange,
    orientation: props.orientation,
    value: props.value,
  });
  const state = createRenderableState(store, store.state);
  const publicState: ToggleGroupState = {
    get disabled() {
      return state().disabled;
    },
    get multiple() {
      return state().multiple;
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
    "multiple",
    "onValueChange",
    "orientation",
    "ref",
    "value",
  ]);
  const element = new ToggleGroupRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  createEffect(() => {
    element.disabled = local.disabled;
    element.loopFocus = local.loopFocus;
    element.multiple = local.multiple;
    element.onValueChange = local.onValueChange;
    element.orientation = local.orientation;
    element.value = local.value;
  });
  setRenderableRef(local.ref, element);

  return createComponent(ToggleGroupContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadRenderableProps(element, () => ({ ...renderableProps, children }));
      return element;
    },
  });
}

/** Types scoped to the Solid ToggleGroup component. */
export namespace ToggleGroup {
  export type Props = ToggleGroupProps;
  export type State = ToggleGroupState;
  export type ChangeDetails = ToggleGroupChangeDetails;
  export type Orientation = ToggleGroupOrientation;
  export type ValueChangeHandler = ToggleGroupValueChangeHandler;
}
