import type { JSX } from "@opentui/solid";
import { spread, useRenderer } from "@opentui/solid";
import {
  type RadioGroupIndicatorOptions,
  RadioGroupIndicatorRenderable,
  type RadioGroupItemOptions,
  RadioGroupItemRenderable,
  type RadioGroupItemState,
  type RadioGroupPrimitiveState,
  type RadioGroupRootOptions,
  RadioGroupRootRenderable,
  RadioGroupStore,
} from "@opentui-ui/core/radio";
import {
  createComponent,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  type Ref,
  Show,
  splitProps,
  untrack,
  useContext,
} from "solid-js";

const RadioGroupContext = createContext<RadioGroupStore>();
const RadioGroupItemContext = createContext<RadioGroupItemRenderable>();

export type RadioGroupPrimitiveRootProps = Omit<
  RadioGroupRootOptions,
  "store"
> & {
  children?: JSX.Element | ((state: RadioGroupPrimitiveState) => JSX.Element);
  ref?: Ref<RadioGroupRootRenderable>;
};

export type RadioGroupPrimitiveItemProps = Omit<
  RadioGroupItemOptions,
  "store"
> & {
  children?: JSX.Element | ((state: RadioGroupItemState) => JSX.Element);
  ref?: Ref<RadioGroupItemRenderable>;
};

export type RadioGroupPrimitiveIndicatorProps = Omit<
  RadioGroupIndicatorOptions,
  "item"
> & {
  children?: JSX.Element;
  keepMounted?: boolean;
  ref?: Ref<RadioGroupIndicatorRenderable>;
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

function RadioGroupRoot(props: RadioGroupPrimitiveRootProps): JSX.Element {
  const renderer = useRenderer();
  const store = new RadioGroupStore({
    value: props.value,
    defaultValue: props.defaultValue,
    disabled: props.disabled,
    onValueChange: props.onValueChange,
  });
  const [state, setState] = createSignal(store.state);
  const publicState: RadioGroupPrimitiveState = {
    get value() {
      return state().value;
    },
    get disabled() {
      return state().disabled;
    },
  };
  const [local, initialProps] = splitProps(props, [
    "children",
    "defaultValue",
    "disabled",
    "onValueChange",
    "ref",
    "value",
  ]);
  const element = new RadioGroupRootRenderable(
    renderer,
    untrack(() => ({ ...initialProps, store })),
  );
  createEffect(() => {
    element.value = local.value;
    element.disabled = local.disabled;
    element.onValueChange = local.onValueChange;
  });
  onCleanup(store.subscribe(setState));
  setRef(local.ref, element);

  return createComponent(RadioGroupContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

function RadioGroupItem(props: RadioGroupPrimitiveItemProps): JSX.Element {
  const renderer = useRenderer();
  const store = useContext(RadioGroupContext);
  if (!store) {
    throw new Error(
      "RadioGroupPrimitive.Item must be rendered inside RadioGroupPrimitive.Root",
    );
  }
  const [local, initialProps] = splitProps(props, [
    "children",
    "disabled",
    "ref",
    "value",
  ]);
  const element = new RadioGroupItemRenderable(
    renderer,
    untrack(() => ({
      ...initialProps,
      store,
      value: local.value,
      disabled: local.disabled,
    })),
  );
  createEffect(() => {
    element.value = local.value;
    element.disabled = local.disabled;
  });
  const [state, setState] = createSignal(element.getState());
  const publicState: RadioGroupItemState = {
    get value() {
      return state().value;
    },
    get available() {
      return state().available;
    },
    get disabled() {
      return state().disabled;
    },
    get focused() {
      return state().focused;
    },
    get selected() {
      return state().selected;
    },
    get tabbable() {
      return state().tabbable;
    },
  };
  onCleanup(element.subscribe(setState));
  setRef(local.ref, element);

  return createComponent(RadioGroupItemContext.Provider, {
    value: element,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

function RadioGroupIndicator(
  props: RadioGroupPrimitiveIndicatorProps,
): JSX.Element {
  const renderer = useRenderer();
  const item = useContext(RadioGroupItemContext);
  if (!item) {
    throw new Error(
      "RadioGroupPrimitive.Indicator must be rendered inside RadioGroupPrimitive.Item",
    );
  }
  const [state, setState] = createSignal(item.getState());
  const [local, initialProps] = splitProps(props, [
    "children",
    "keepMounted",
    "ref",
  ]);
  onCleanup(item.subscribe(setState));

  return createComponent(Show, {
    keyed: true,
    get when() {
      return local.keepMounted || state().selected;
    },
    get children() {
      const element = new RadioGroupIndicatorRenderable(
        renderer,
        untrack(() => ({ ...initialProps, item })),
      );
      const children = local.children;
      setRef(local.ref, element);
      spreadProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

export const RadioGroupPrimitive = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
} as const;
