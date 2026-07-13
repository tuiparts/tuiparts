import type { JSX } from "@opentui/solid";
import { spread, useRenderer } from "@opentui/solid";
import {
  type SwitchPrimitiveState,
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

const SwitchContext = createContext<SwitchStore>();

export type SwitchPrimitiveRootProps = Omit<SwitchRootOptions, "store"> & {
  children?: JSX.Element | ((state: SwitchPrimitiveState) => JSX.Element);
  ref?: Ref<SwitchRootRenderable>;
};

export type SwitchPrimitiveThumbProps = Omit<SwitchThumbOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<SwitchThumbRenderable>;
};

function setRef<T>(ref: Ref<T> | undefined, value: T): void {
  if (typeof ref === "function") (ref as (value: T) => void)(value);
}

function spreadProps<T extends object>(
  element: Parameters<typeof spread>[0],
  getProps: () => T,
): void {
  let previousKeys: string[] = [];
  spread(element, () => {
    const next = getProps() as Record<string, unknown>;
    const removed = Object.fromEntries(
      previousKeys
        .filter((key) => !Object.hasOwn(next, key))
        .map((key) => [key, undefined]),
    );
    previousKeys = Object.keys(next);
    return { ...removed, ...next };
  });
}

function SwitchRoot(props: SwitchPrimitiveRootProps): JSX.Element {
  const renderer = useRenderer();
  const store = new SwitchStore({
    checked: props.checked,
    defaultChecked: props.defaultChecked,
    disabled: props.disabled,
    onCheckedChange: props.onCheckedChange,
  });
  const [state, setState] = createSignal(store.state);
  const publicState: SwitchPrimitiveState = {
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
  setRef(local.ref, element);

  return createComponent(SwitchContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

function SwitchThumb(props: SwitchPrimitiveThumbProps): JSX.Element {
  const renderer = useRenderer();
  const store = useContext(SwitchContext);
  if (!store) {
    throw new Error(
      "SwitchPrimitive.Thumb must be rendered inside SwitchPrimitive.Root",
    );
  }
  const [local, initialProps] = splitProps(props, ["children", "ref"]);
  const element = new SwitchThumbRenderable(
    renderer,
    untrack(() => ({ ...initialProps, store })),
  );
  setRef(local.ref, element);
  spreadProps(element, () => ({
    ...initialProps,
    children: local.children,
  }));
  return element;
}

export const SwitchPrimitive = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
} as const;
