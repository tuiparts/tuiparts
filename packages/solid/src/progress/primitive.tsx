/** @jsxImportSource @opentui/solid */

import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type ProgressIndicatorOptions,
  ProgressIndicatorRenderable,
  type ProgressRootOptions,
  ProgressRootRenderable,
  type ProgressState,
  ProgressStore,
  type ProgressValueChangeHandler,
} from "@tuiparts/core/progress";
import {
  createComponent,
  createContext,
  createEffect,
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
import { createRenderableState } from "../internal/renderable-state";

const StoreContext = createContext<ProgressStore>();

type RootProps = Omit<ProgressRootOptions, "store"> & {
  children?: JSX.Element | ((state: ProgressState) => JSX.Element);
  ref?: Ref<ProgressRootRenderable>;
};

type IndicatorProps = Omit<ProgressIndicatorOptions, "store"> & {
  children?: JSX.Element | ((state: ProgressState) => JSX.Element);
  ref?: Ref<ProgressIndicatorRenderable>;
};

function useStore(part: string): ProgressStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(`Progress.${part} must be rendered inside Progress.Root`);
  }
  return store;
}

/** Solid Progress Root adapter. */
export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const store = new ProgressStore(untrack(() => props));
  const state = createRenderableState(store, store.state);
  const publicState: ProgressState = {
    get max() {
      return state().max;
    },
    get percentage() {
      return state().percentage;
    },
    get value() {
      return state().value;
    },
  };

  const [local, renderableProps] = splitProps(props, [
    "children",
    "defaultValue",
    "max",
    "onValueChange",
    "ref",
    "value",
  ]);

  const element = new ProgressRootRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );

  createEffect(() => {
    element.max = local.max;
    element.onValueChange = local.onValueChange;
    store.setControlledValue(local.value);
  });

  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);
  onCleanup(() => {
    setRenderableRef(ref, undefined);
    element.endCoordinationLifetime();
    store.destroy();
  });

  return createComponent(StoreContext.Provider, {
    value: store,
    get children() {
      spreadRenderableProps(element, () => ({ ...renderableProps }));
      spreadRenderableProps(element, () => {
        const child = local.children;
        return {
          children: typeof child === "function" ? child(publicState) : child,
        };
      });
      return element;
    },
  });
}

/** Solid Progress Indicator adapter. */
export function Indicator(props: IndicatorProps): JSX.Element {
  const store = useStore("Indicator");
  const renderer = useRenderer();
  const state = createRenderableState(store, store.state);
  const publicState: ProgressState = {
    get max() {
      return state().max;
    },
    get percentage() {
      return state().percentage;
    },
    get value() {
      return state().value;
    },
  };

  const [local, renderableProps] = splitProps(props, ["children", "ref"]);
  const element = new ProgressIndicatorRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );

  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);
  onCleanup(() => {
    setRenderableRef(ref, undefined);
  });

  spreadRenderableProps(element, () => {
    const child = local.children;
    const children = typeof child === "function" ? child(publicState) : child;
    return { ...renderableProps, children };
  });

  return element;
}

export namespace Root {
  export type Props = RootProps;
  export type State = ProgressState;
}

export namespace Indicator {
  export type Props = IndicatorProps;
  export type State = ProgressState;
}

export type State = ProgressState;
export type ValueChangeHandler = ProgressValueChangeHandler;
