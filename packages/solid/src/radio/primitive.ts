import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type RadioIndicatorOptions,
  RadioIndicatorRenderable,
  type RadioRootOptions,
  RadioRootRenderable,
  type RadioState,
} from "@opentui-ui/core/radio";
import {
  type RadioGroupChangeDetails,
  type RadioGroupOptions,
  RadioGroupRenderable,
  type RadioGroupState,
  RadioGroupStore,
  type RadioGroupValueChangeHandler,
} from "@opentui-ui/core/radio-group";
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
const RadioContext = createContext<RadioRootRenderable>();

type RadioGroupProps = Omit<RadioGroupOptions, "store"> & {
  children?: JSX.Element | ((state: RadioGroupState) => JSX.Element);
  ref?: Ref<RadioGroupRenderable>;
};

type RootProps = Omit<RadioRootOptions, "store"> & {
  children?: JSX.Element | ((state: RadioState) => JSX.Element);
  ref?: Ref<RadioRootRenderable>;
};

type IndicatorProps = Omit<RadioIndicatorOptions, "radio"> & {
  children?: JSX.Element;
  keepMounted?: boolean;
  ref?: Ref<RadioIndicatorRenderable>;
};

export function RadioGroup(props: RadioGroup.Props): JSX.Element {
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
  const element = new RadioGroupRenderable(
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

export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useContext(RadioGroupContext);
  if (!store) {
    throw new Error("Radio.Root must be rendered inside RadioGroup");
  }
  const [local, initialProps] = splitProps(props, [
    "children",
    "disabled",
    "ref",
    "value",
  ]);
  const element = new RadioRootRenderable(
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
  const publicState: RadioState = {
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
    get checked() {
      return state().checked;
    },
    get tabbable() {
      return state().tabbable;
    },
  };
  setRenderableRef(local.ref, element);

  return createComponent(RadioContext.Provider, {
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
  const item = useContext(RadioContext);
  if (!item) {
    throw new Error("Radio.Indicator must be rendered inside Radio.Root");
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
      return local.keepMounted || state().checked;
    },
    get children() {
      const element = new RadioIndicatorRenderable(
        renderer,
        untrack(() => ({ ...initialProps, radio: item })),
      );
      const children = local.children;
      setRenderableRef(local.ref, element);
      spreadRenderableProps(element, () => ({ ...initialProps, children }));
      return element;
    },
  });
}

export namespace RadioGroup {
  export type Props = RadioGroupProps;
  export type State = RadioGroupState;
  export type ChangeDetails = RadioGroupChangeDetails;
  export type ValueChangeHandler = RadioGroupValueChangeHandler;
}

export namespace Root {
  export type Props = RootProps;
  export type State = RadioState;
}

export namespace Indicator {
  export type Props = IndicatorProps;
}
