import type { JSX } from "@opentui/solid";
import { spread, useRenderer } from "@opentui/solid";
import {
  type CheckboxIndicatorOptions,
  CheckboxIndicatorRenderable,
  type CheckboxPrimitiveState,
  type CheckboxRootOptions,
  CheckboxRootRenderable,
  CheckboxStore,
} from "@opentui-ui/core/checkbox";
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

const CheckboxContext = createContext<CheckboxStore>();

export type CheckboxPrimitiveRootProps = Omit<CheckboxRootOptions, "store"> & {
  children?: JSX.Element | ((state: CheckboxPrimitiveState) => JSX.Element);
  ref?: Ref<CheckboxRootRenderable>;
};

export type CheckboxPrimitiveIndicatorProps = Omit<
  CheckboxIndicatorOptions,
  "store"
> & {
  children?: JSX.Element;
  ref?: Ref<CheckboxIndicatorRenderable>;
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

function CheckboxRoot(props: CheckboxPrimitiveRootProps): JSX.Element {
  const renderer = useRenderer();
  const store = new CheckboxStore({
    checked: props.checked,
    defaultChecked: props.defaultChecked,
    disabled: props.disabled,
    onCheckedChange: props.onCheckedChange,
  });
  const [state, setState] = createSignal(store.state);
  const publicState: CheckboxPrimitiveState = {
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
  const element = new CheckboxRootRenderable(
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

  return createComponent(CheckboxContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

function CheckboxIndicator(
  props: CheckboxPrimitiveIndicatorProps,
): JSX.Element {
  const renderer = useRenderer();
  const store = useContext(CheckboxContext);
  if (!store) {
    throw new Error(
      "CheckboxPrimitive.Indicator must be rendered inside CheckboxPrimitive.Root",
    );
  }
  const [local, initialProps] = splitProps(props, ["children", "ref"]);
  const element = new CheckboxIndicatorRenderable(
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

export const CheckboxPrimitive = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
} as const;
