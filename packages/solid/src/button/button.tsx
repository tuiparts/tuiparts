import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type ButtonOptions,
  type ButtonPressDetails,
  ButtonRenderable,
  type ButtonState,
} from "@tuiparts/core/button";
import { createEffect, type Ref, splitProps, untrack } from "solid-js";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";
import { createRenderableState } from "../internal/renderable-state";

type ButtonProps = Omit<ButtonOptions, "store"> & {
  children?: JSX.Element | ((state: ButtonState) => JSX.Element);
  ref?: Ref<ButtonRenderable>;
};

export function Button(props: Button.Props): JSX.Element {
  const renderer = useRenderer();
  const [local, renderableProps] = splitProps(props, [
    "children",
    "disabled",
    "onPress",
    "ref",
  ]);
  const element = new ButtonRenderable(
    renderer,
    untrack(() => ({
      ...renderableProps,
      disabled: local.disabled,
      onPress: local.onPress,
    })),
  );
  const state = createRenderableState(element, element.getState());
  const publicState: ButtonState = {
    get disabled() {
      return state().disabled;
    },
    get focused() {
      return state().focused;
    },
    get pressed() {
      return state().pressed;
    },
  };
  createEffect(() => {
    element.disabled = local.disabled;
    element.onPress = local.onPress;
  });
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => {
    const child = local.children;
    const children = typeof child === "function" ? child(publicState) : child;
    return { ...renderableProps, children };
  });
  return element;
}

export namespace Button {
  export type Props = ButtonProps;
  export type State = ButtonState;
  export type PressDetails = ButtonPressDetails;
}
