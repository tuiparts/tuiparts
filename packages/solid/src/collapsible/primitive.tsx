/** @jsxImportSource @opentui/solid */

import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type CollapsibleOpenChangeDetails,
  type CollapsibleOpenChangeHandler,
  type CollapsiblePanelOptions,
  CollapsiblePanelRenderable,
  type CollapsiblePanelState,
  type CollapsibleRootOptions,
  CollapsibleRootRenderable,
  type CollapsibleState,
  CollapsibleStore,
  type CollapsibleTriggerOptions,
  CollapsibleTriggerRenderable,
  type CollapsibleTriggerState,
} from "@tuiparts/core/collapsible";
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

const StoreContext = createContext<CollapsibleStore>();

type RootProps = Omit<CollapsibleRootOptions, "store"> & {
  children?: JSX.Element | ((state: CollapsibleState) => JSX.Element);
  ref?: Ref<CollapsibleRootRenderable>;
};

type TriggerProps = Omit<CollapsibleTriggerOptions, "store"> & {
  children?: JSX.Element | ((state: CollapsibleTriggerState) => JSX.Element);
  ref?: Ref<CollapsibleTriggerRenderable>;
};

type PanelProps = Omit<CollapsiblePanelOptions, "store"> & {
  children?: JSX.Element | ((state: CollapsiblePanelState) => JSX.Element);
  keepMounted?: boolean;
  ref?: Ref<CollapsiblePanelRenderable>;
};

function useStore(part: string): CollapsibleStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(
      `Collapsible.${part} must be rendered inside Collapsible.Root`,
    );
  }
  return store;
}

/** Solid Collapsible Root adapter. */
export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const store = new CollapsibleStore(untrack(() => props));
  const state = createRenderableState(store, store.state);
  const publicState: CollapsibleState = {
    get disabled() {
      return state().disabled;
    },
    get open() {
      return state().open;
    },
  };
  const [local, renderableProps] = splitProps(props, [
    "children",
    "defaultOpen",
    "disabled",
    "onOpenChange",
    "open",
    "ref",
  ]);
  const element = new CollapsibleRootRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  createEffect(() => {
    element.disabled = local.disabled;
    element.onOpenChange = local.onOpenChange;
    element.open = local.open;
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

/** Solid Collapsible Trigger adapter. */
export function Trigger(props: Trigger.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useStore("Trigger");
  const [local, renderableProps] = splitProps(props, ["children", "ref"]);
  const element = new CollapsibleTriggerRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  const state = createRenderableState(element, element.getState());
  const publicState: CollapsibleTriggerState = {
    get disabled() {
      return state().disabled;
    },
    get focused() {
      return state().focused;
    },
    get open() {
      return state().open;
    },
  };
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
}

/** Solid Collapsible Panel adapter with optional retained mounting. */
export function Panel(props: Panel.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useStore("Panel");
  const rootState = createRenderableState(store, store.state);
  const [local, renderableProps] = splitProps(props, [
    "children",
    "keepMounted",
    "ref",
  ]);
  return createComponent(Show, {
    keyed: true,
    get when() {
      return local.keepMounted || rootState().open;
    },
    get children() {
      const element = new CollapsiblePanelRenderable(
        renderer,
        untrack(() => ({ ...renderableProps, store })),
      );
      const state = createRenderableState(element, element.getState());
      const publicState: CollapsiblePanelState = {
        get open() {
          return state().open;
        },
      };
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

/** Types scoped to Collapsible.Root. */
export namespace Root {
  export type Props = RootProps;
  export type State = CollapsibleState;
  export type ChangeDetails = CollapsibleOpenChangeDetails;
  export type OpenChangeHandler = CollapsibleOpenChangeHandler;
}

/** Types scoped to Collapsible.Trigger. */
export namespace Trigger {
  export type Props = TriggerProps;
  export type State = CollapsibleTriggerState;
}

/** Types scoped to Collapsible.Panel. */
export namespace Panel {
  export type Props = PanelProps;
  export type State = CollapsiblePanelState;
}
