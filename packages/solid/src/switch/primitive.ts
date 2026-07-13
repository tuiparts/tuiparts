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

const SwitchContext = createContext<SwitchRootRenderable>();

export type SwitchProps = SwitchRootOptions & {
  children?: JSX.Element | ((state: SwitchState) => JSX.Element);
  ref?: Ref<SwitchRootRenderable>;
};

export type SwitchThumbProps = Omit<SwitchThumbOptions, "root"> & {
  children?: JSX.Element;
  ref?: Ref<SwitchThumbRenderable>;
};

function SwitchRoot(props: SwitchProps): JSX.Element {
  const renderer = useRenderer();
  const [state, setState] = createSignal<SwitchState>();
  const publicState: SwitchState = {
    get checked() {
      return state()?.checked ?? props.checked ?? props.defaultChecked ?? false;
    },
    get disabled() {
      return state()?.disabled ?? props.disabled ?? false;
    },
    get focused() {
      return state()?.focused ?? false;
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
    untrack(() => ({
      ...initialProps,
      checked: local.checked,
      defaultChecked: local.defaultChecked,
      disabled: local.disabled,
      onCheckedChange: local.onCheckedChange,
    })),
  );
  setState(element.getState());
  createEffect(() => {
    element.checked = local.checked;
    element.disabled = local.disabled;
    element.onCheckedChange = local.onCheckedChange;
  });
  onCleanup(element.subscribe(setState));
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

function SwitchThumb(props: SwitchThumbProps): JSX.Element {
  const renderer = useRenderer();
  const root = useContext(SwitchContext);
  if (!root) {
    throw new Error("Switch.Thumb must be rendered inside Switch.Root");
  }
  const [local, initialProps] = splitProps(props, ["children", "ref"]);
  const element = new SwitchThumbRenderable(
    renderer,
    untrack(() => ({ ...initialProps, root })),
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
