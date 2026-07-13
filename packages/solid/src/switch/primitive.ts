import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type SwitchState,
  type SwitchRootOptions,
  SwitchRootRenderable,
  SwitchStore,
  type SwitchThumbOptions,
  SwitchThumbRenderable,
} from "@opentui-ui/core/switch";
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

const SwitchContext = createContext<SwitchStore>();

export type SwitchProps = Omit<SwitchRootOptions, "store"> & {
  children?: JSX.Element | ((state: SwitchState) => JSX.Element);
  ref?: Ref<SwitchRootRenderable>;
};

export type SwitchThumbProps = Omit<SwitchThumbOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<SwitchThumbRenderable>;
};

function SwitchRoot(props: SwitchProps): JSX.Element {
  const renderer = useRenderer();
  const store = new SwitchStore({
    checked: props.checked,
    defaultChecked: props.defaultChecked,
    disabled: props.disabled,
    onCheckedChange: props.onCheckedChange,
  });
  const [state, setState] = createSignal(store.state);
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
    untrack(() => ({ ...initialProps, store })),
  );
  createEffect(() => {
    element.checked = local.checked;
    element.disabled = local.disabled;
    element.onCheckedChange = local.onCheckedChange;
  });
  onCleanup(store.subscribe(setState));
  setRenderableRef(local.ref, element);

  return createComponent(SwitchContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadRenderableProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

function SwitchThumb(props: SwitchThumbProps): JSX.Element {
  const renderer = useRenderer();
  const store = useContext(SwitchContext);
  if (!store) {
    throw new Error("Switch.Thumb must be rendered inside Switch.Root");
  }
  const [local, initialProps] = splitProps(props, ["children", "ref"]);
  const element = new SwitchThumbRenderable(
    renderer,
    untrack(() => ({ ...initialProps, store })),
  );
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({
    ...initialProps,
    children: local.children,
  }));
  return element;
}

export const Switch = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
} as const;
