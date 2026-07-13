import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type SwitchRootOptions,
  SwitchRootRenderable,
  type SwitchState,
  type SwitchThumbOptions,
  SwitchThumbRenderable,
} from "@opentui-ui/core/switch";
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

const SwitchContext = createContext<SwitchRootRenderable>();

type RootProps = SwitchRootOptions & {
  children?: JSX.Element | ((state: SwitchState) => JSX.Element);
  ref?: Ref<SwitchRootRenderable>;
};

type ThumbProps = Omit<SwitchThumbOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<SwitchThumbRenderable>;
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
  const element = new SwitchRootRenderable(
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
  const publicState: SwitchState = {
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

  return createComponent(SwitchContext.Provider, {
    value: element,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadRenderableProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

export function Thumb(props: Thumb.Props): JSX.Element {
  const renderer = useRenderer();
  const root = useContext(SwitchContext);
  if (!root) {
    throw new Error("Switch.Thumb must be rendered inside Switch.Root");
  }
  const [local, initialProps] = splitProps(props, ["children", "ref"]);
  const element = new SwitchThumbRenderable(
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
  export type State = SwitchState;
}

export namespace Thumb {
  export type Props = ThumbProps;
}
