import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type RadioGroupChangeDetails,
  type RadioGroupIndicatorOptions,
  RadioGroupIndicatorRenderable,
  type RadioGroupItemOptions,
  RadioGroupItemRenderable,
  type RadioGroupItemState,
  type RadioGroupRootOptions,
  RadioGroupRootRenderable,
  type RadioGroupState,
  RadioGroupStore,
  type RadioGroupValueChangeHandler,
} from "@opentui-ui/core/radio";
import {
  createComponent,
  createContext,
  createEffect,
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
import { createRenderableState } from "../internal/renderable-state";

const RadioGroupContext = createContext<RadioGroupStore>();
const RadioGroupItemContext = createContext<RadioGroupItemRenderable>();

type RootProps = Omit<RadioGroupRootOptions, "store"> & {
  children?: JSX.Element | ((state: RadioGroupState) => JSX.Element);
  ref?: Ref<RadioGroupRootRenderable>;
};

type ItemProps = Omit<RadioGroupItemOptions, "store"> & {
  children?: JSX.Element | ((state: RadioGroupItemState) => JSX.Element);
  ref?: Ref<RadioGroupItemRenderable>;
};

type IndicatorProps = Omit<RadioGroupIndicatorOptions, "item"> & {
  children?: JSX.Element;
  keepMounted?: boolean;
  ref?: Ref<RadioGroupIndicatorRenderable>;
};

export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const store = new RadioGroupStore({
    value: props.value,
    defaultValue: props.defaultValue,
    disabled: props.disabled,
    onValueChange: props.onValueChange,
  });
  const state = createRenderableState(store, store.state);
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

export function Item(props: Item.Props): JSX.Element {
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
  const state = createRenderableState(element, element.getState());
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

export function Indicator(props: Indicator.Props): JSX.Element {
  const renderer = useRenderer();
  const item = useContext(RadioGroupItemContext);
  if (!item) {
    throw new Error(
      "RadioGroup.Indicator must be rendered inside RadioGroup.Item",
    );
  }
  const state = createRenderableState(item, item.getState());
  const [local, initialProps] = splitProps(props, [
    "children",
    "keepMounted",
    "ref",
  ]);

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

export namespace Root {
  export type Props = RootProps;
  export type State = RadioGroupState;
  export type ChangeDetails = RadioGroupChangeDetails;
  export type ValueChangeHandler = RadioGroupValueChangeHandler;
}

export namespace Item {
  export type Props = ItemProps;
  export type State = RadioGroupItemState;
}

export namespace Indicator {
  export type Props = IndicatorProps;
}
