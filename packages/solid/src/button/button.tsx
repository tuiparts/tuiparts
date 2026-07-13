import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type ButtonRootOptions,
  ButtonRootRenderable,
  type ButtonState,
  ButtonStore,
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

export type ButtonProps = Omit<ButtonRootOptions, "store"> & {
  children?: JSX.Element | ((state: ButtonState) => JSX.Element);
  ref?: Ref<ButtonRootRenderable>;
};

function ButtonRoot(props: ButtonProps): JSX.Element {
  const renderer = useRenderer();
  const store = new ButtonStore({
    disabled: props.disabled,
    onPress: props.onPress,
  });
  const [state, setState] = createSignal(store.state);
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
  const [local, initialProps] = splitProps(props, [
    "children",
    "disabled",
    "onPress",
    "ref",
  ]);
  const element = new ButtonRootRenderable(
    renderer,
    untrack(() => ({ ...initialProps, store })),
  );
  createEffect(() => {
    element.disabled = local.disabled;
    element.onPress = local.onPress;
  });
  onCleanup(store.subscribe(setState));
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => {
    const child = local.children;
    const children = typeof child === "function" ? child(publicState) : child;
    return { ...initialProps, children };
  });
  return element;
}

export const Button = {
  Root: ButtonRoot,
} as const;
