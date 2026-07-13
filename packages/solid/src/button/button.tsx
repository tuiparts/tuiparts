import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type ButtonOptions,
  ButtonRenderable,
  type ButtonState,
} from "@opentui-ui/core/button";
import {
  createEffect,
  createSignal,
  onCleanup,
  type Ref,
  splitProps,
  untrack,
} from "solid-js";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";

export type ButtonProps = ButtonOptions & {
  children?: JSX.Element | ((state: ButtonState) => JSX.Element);
  ref?: Ref<ButtonRenderable>;
};

export function Button(props: ButtonProps): JSX.Element {
  const renderer = useRenderer();
  const [state, setState] = createSignal<ButtonState>();
  const publicState: ButtonState = {
    get disabled() {
      return state()?.disabled ?? props.disabled ?? false;
    },
    get focused() {
      return state()?.focused ?? false;
    },
    get pressed() {
      return state()?.pressed ?? false;
    },
  };
  const [local, initialProps] = splitProps(props, [
    "children",
    "disabled",
    "onPress",
    "ref",
  ]);
  const element = new ButtonRenderable(
    renderer,
    untrack(() => ({
      ...initialProps,
      disabled: local.disabled,
      onPress: local.onPress,
    })),
  );
  setState(element.getState());
  createEffect(() => {
    element.disabled = local.disabled;
    element.onPress = local.onPress;
  });
  onCleanup(element.subscribe(setState));
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => {
    const child = local.children;
    const children = typeof child === "function" ? child(publicState) : child;
    return { ...initialProps, children };
  });
  return element;
}
