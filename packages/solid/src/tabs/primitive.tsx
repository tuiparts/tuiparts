/** @jsxImportSource @opentui/solid */

import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type TabsActivationMode,
  type TabsChangeDetails,
  type TabsListOptions,
  TabsListRenderable,
  type TabsOrientation,
  type TabsPanelOptions,
  TabsPanelRenderable,
  type TabsPanelState,
  type TabsRootOptions,
  TabsRootRenderable,
  type TabsState,
  TabsStore,
  type TabsTabOptions,
  TabsTabRenderable,
  type TabsTabState,
  type TabsValueChangeHandler,
} from "@tuiparts/core/tabs";
import {
  createComponent,
  createContext,
  createEffect,
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
import { createRenderableState } from "../internal/renderable-state";

const StoreContext = createContext<TabsStore>();

type RootProps = Omit<TabsRootOptions, "store"> & {
  children?: JSX.Element | ((state: TabsState) => JSX.Element);
  ref?: Ref<TabsRootRenderable>;
};
type ListProps = Omit<TabsListOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<TabsListRenderable>;
};
type TabProps = Omit<TabsTabOptions, "store"> & {
  children?: JSX.Element | ((state: TabsTabState) => JSX.Element);
  ref?: Ref<TabsTabRenderable>;
};
type PanelProps = Omit<TabsPanelOptions, "store"> & {
  children?: JSX.Element | ((state: TabsPanelState) => JSX.Element);
  keepMounted?: boolean;
  ref?: Ref<TabsPanelRenderable>;
};

function useStore(part: string): TabsStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error(`Tabs.${part} must be rendered inside Tabs.Root`);
  return store;
}

/** Solid Tabs Root adapter. */
export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const store = new TabsStore(untrack(() => props));
  const state = createRenderableState(store, store.state);
  const publicState: TabsState = {
    get activationMode() {
      return state().activationMode;
    },
    get disabled() {
      return state().disabled;
    },
    get orientation() {
      return state().orientation;
    },
    get value() {
      return state().value;
    },
  };
  const [local, renderableProps] = splitProps(props, [
    "activationMode",
    "children",
    "defaultValue",
    "disabled",
    "loopFocus",
    "onValueChange",
    "orientation",
    "ref",
    "value",
  ]);
  const element = new TabsRootRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  createEffect(() => {
    element.activationMode = local.activationMode;
    element.disabled = local.disabled;
    element.loopFocus = local.loopFocus;
    element.onValueChange = local.onValueChange;
    element.orientation = local.orientation;
    element.value = local.value;
  });
  onCleanup(() => store.destroy());
  setRenderableRef(local.ref, element);
  return createComponent(StoreContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const children = typeof child === "function" ? child(publicState) : child;
      spreadRenderableProps(element, () => ({ ...renderableProps, children }));
      return element;
    },
  });
}

/** Solid Tabs List adapter. */
export function List(props: List.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useStore("List");
  const [local, renderableProps] = splitProps(props, ["children", "ref"]);
  const element = new TabsListRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({
    ...renderableProps,
    children: local.children,
  }));
  return element;
}

/** Solid Tabs Tab adapter. */
export function Tab(props: Tab.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useStore("Tab");
  const [local, renderableProps] = splitProps(props, [
    "children",
    "disabled",
    "ref",
    "value",
  ]);
  const element = new TabsTabRenderable(
    renderer,
    untrack(() => ({
      ...renderableProps,
      disabled: local.disabled,
      store,
      value: local.value,
    })),
  );
  const state = createRenderableState(element, element.getState());
  const publicState: TabsTabState = {
    get associated() {
      return state().associated;
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
    get value() {
      return state().value;
    },
  };
  createEffect(() => {
    element.disabled = local.disabled;
    element.value = local.value;
  });
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => {
    const child = local.children;
    return {
      ...renderableProps,
      children: typeof child === "function" ? child(publicState) : child,
    };
  });
  return element;
}

/** Solid Tabs Panel adapter with optional retained mounting. */
export function Panel(props: Panel.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useStore("Panel");
  const rootState = createRenderableState(store, store.state);
  const [local, renderableProps] = splitProps(props, [
    "children",
    "keepMounted",
    "ref",
    "value",
  ]);
  return createComponent(Show, {
    keyed: true,
    get when() {
      rootState();
      return local.keepMounted || store.getPanelState(local.value).active;
    },
    get children() {
      const element = new TabsPanelRenderable(
        renderer,
        untrack(() => ({
          ...renderableProps,
          store,
          value: local.value,
        })),
      );
      const state = createRenderableState(element, element.getState());
      const publicState: TabsPanelState = {
        get active() {
          return state().active;
        },
        get associated() {
          return state().associated;
        },
        get value() {
          return state().value;
        },
      };
      createEffect(() => {
        element.value = local.value;
      });
      const ref = untrack(() => local.ref);
      setRenderableRef(ref, element);
      onCleanup(() => setRenderableRef(ref, undefined));
      spreadRenderableProps(element, () => {
        const child = local.children;
        return {
          ...renderableProps,
          children: typeof child === "function" ? child(publicState) : child,
        };
      });
      return element;
    },
  });
}

/** Types scoped to Tabs.Root. */
export namespace Root {
  export type Props = RootProps;
  export type State = TabsState;
  export type ActivationMode = TabsActivationMode;
  export type ChangeDetails = TabsChangeDetails;
  export type Orientation = TabsOrientation;
  export type ValueChangeHandler = TabsValueChangeHandler;
}
/** Types scoped to Tabs.List. */
export namespace List {
  export type Props = ListProps;
}
/** Types scoped to Tabs.Tab. */
export namespace Tab {
  export type Props = TabProps;
  export type State = TabsTabState;
}
/** Types scoped to Tabs.Panel. */
export namespace Panel {
  export type Props = PanelProps;
  export type State = TabsPanelState;
}
