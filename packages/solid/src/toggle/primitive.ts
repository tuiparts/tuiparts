import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type ToggleChangeDetails,
  type ToggleOptions,
  type TogglePressedChangeHandler,
  ToggleRenderable,
  type ToggleState,
} from "@tuiparts/core/toggle";
import type { ToggleGroupStore } from "@tuiparts/core/toggle-group";
import {
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

/** Private group ownership consumed by Toggle. */
export const ToggleGroupContext = createContext<ToggleGroupStore>();

type ToggleProps = Omit<ToggleOptions, "group" | "store"> & {
  children?: JSX.Element | ((state: ToggleState) => JSX.Element);
  ref?: Ref<ToggleRenderable>;
};

/** Solid adapter for a standalone or grouped Toggle. */
export function Toggle(props: Toggle.Props): JSX.Element {
  const renderer = useRenderer();
  const group = useContext(ToggleGroupContext);
  const [local, renderableProps] = splitProps(props, [
    "children",
    "defaultPressed",
    "disabled",
    "onPressedChange",
    "pressed",
    "ref",
    "value",
  ]);
  const element = new ToggleRenderable(
    renderer,
    untrack(() => ({
      ...renderableProps,
      defaultPressed: local.defaultPressed,
      disabled: local.disabled,
      group,
      onPressedChange: local.onPressedChange,
      pressed: local.pressed,
      value: local.value,
    })),
  );
  const state = createRenderableState(element, element.getState());
  const publicState: ToggleState = {
    get disabled() {
      return state().disabled;
    },
    get focused() {
      return state().focused;
    },
    get pressed() {
      return state().pressed;
    },
    get tabbable() {
      return state().tabbable;
    },
  };
  createEffect(() => {
    element.disabled = local.disabled;
    element.onPressedChange = local.onPressedChange;
    element.pressed = local.pressed;
    element.value = local.value;
  });
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => {
    const child = local.children;
    const children = typeof child === "function" ? child(publicState) : child;
    return { ...renderableProps, children };
  });
  return element;
}

/** Types scoped to the Solid Toggle component. */
export namespace Toggle {
  export type Props = ToggleProps;
  export type State = ToggleState;
  export type ChangeDetails = ToggleChangeDetails;
  export type PressedChangeHandler = TogglePressedChangeHandler;
}
