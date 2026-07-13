import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type RadioGroupIndicatorOptions,
  RadioGroupIndicatorRenderable,
  type RadioGroupItemOptions,
  RadioGroupItemRenderable,
  type RadioGroupItemState,
  type RadioGroupState,
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
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";

const RadioGroupContext = createContext<RadioGroupStore>();
const RadioGroupItemContext = createContext<RadioGroupItemRenderable>();

export type RadioGroupProps = Omit<RadioGroupRootOptions, "store"> & {
  children?: JSX.Element | ((state: RadioGroupState) => JSX.Element);
  ref?: Ref<RadioGroupRootRenderable>;
};

export type RadioGroupItemProps = Omit<RadioGroupItemOptions, "store"> & {
  children?: JSX.Element | ((state: RadioGroupItemState) => JSX.Element);
  ref?: Ref<RadioGroupItemRenderable>;
};

export type RadioGroupIndicatorProps = Omit<
  RadioGroupIndicatorOptions,
  "item"
> & {
  children?: JSX.Element;
  keepMounted?: boolean;
  ref?: Ref<RadioGroupIndicatorRenderable>;
};

function RadioGroupRoot(props: RadioGroupProps): JSX.Element {
  const renderer = useRenderer();
  const store = new RadioGroupStore({
    value: props.value,
    defaultValue: props.defaultValue,
    disabled: props.disabled,
    onValueChange: props.onValueChange,
  });
  const [state, setState] = createSignal(store.state);
  const publicState: RadioGroupState = {
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
  setRenderableRef(local.ref, element);

  return createComponent(RadioGroupContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadRenderableProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

function RadioGroupItem(props: RadioGroupItemProps): JSX.Element {
  const renderer = useRenderer();
  const store = useContext(RadioGroupContext);
  if (!store) {
    throw new Error("RadioGroup.Item must be rendered inside RadioGroup.Root");
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
  setRenderableRef(local.ref, element);

  return createComponent(RadioGroupItemContext.Provider, {
    value: element,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadRenderableProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

function RadioGroupIndicator(props: RadioGroupIndicatorProps): JSX.Element {
  const renderer = useRenderer();
  const item = useContext(RadioGroupItemContext);
  if (!item) {
    throw new Error(
      "RadioGroup.Indicator must be rendered inside RadioGroup.Item",
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
      setRenderableRef(local.ref, element);
      spreadRenderableProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

export const RadioGroup = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
} as const;
