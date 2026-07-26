/** @jsxImportSource @opentui/solid */

import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type AccordionItemOpenChangeHandler,
  type AccordionItemOptions,
  AccordionItemRenderable,
  type AccordionItemState,
  type AccordionPanelOptions,
  AccordionPanelRenderable,
  type AccordionPanelState,
  type AccordionRootOptions,
  AccordionRootRenderable,
  type AccordionState,
  AccordionStore,
  type AccordionTriggerOptions,
  AccordionTriggerRenderable,
  type AccordionTriggerState,
  type AccordionValueChangeDetails,
  type AccordionValueChangeHandler,
} from "@tuiparts/core/accordion";
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

const StoreContext = createContext<AccordionStore>();
const ItemContext = createContext<AccordionItemRenderable>();

type RootProps = Omit<AccordionRootOptions, "store"> & {
  children?: JSX.Element | ((state: AccordionState) => JSX.Element);
  ref?: Ref<AccordionRootRenderable>;
};

type ItemProps = Omit<AccordionItemOptions, "store"> & {
  children?: JSX.Element | ((state: AccordionItemState) => JSX.Element);
  ref?: Ref<AccordionItemRenderable>;
};

type TriggerProps = Omit<AccordionTriggerOptions, "item"> & {
  children?: JSX.Element | ((state: AccordionTriggerState) => JSX.Element);
  ref?: Ref<AccordionTriggerRenderable>;
};

type PanelProps = Omit<AccordionPanelOptions, "item"> & {
  children?: JSX.Element | ((state: AccordionPanelState) => JSX.Element);
  keepMounted?: boolean;
  ref?: Ref<AccordionPanelRenderable>;
};

function useStore(part: string): AccordionStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(`Accordion.${part} must be rendered inside Accordion.Root`);
  }
  return store;
}

function useItem(part: string): AccordionItemRenderable {
  const item = useContext(ItemContext);
  if (!item) {
    throw new Error(`Accordion.${part} must be rendered inside Accordion.Item`);
  }
  return item;
}

/** Solid Accordion Root adapter. */
export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const store = new AccordionStore(untrack(() => props));
  const state = createRenderableState(store, store.state);
  const publicState: AccordionState = {
    get disabled() {
      return state().disabled;
    },
    get multiple() {
      return state().multiple;
    },
    get value() {
      return state().value;
    },
  };
  const [local, renderableProps] = splitProps(props, [
    "children",
    "defaultValue",
    "disabled",
    "multiple",
    "onValueChange",
    "ref",
    "value",
  ]);
  const element = new AccordionRootRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  createEffect(() => {
    element.disabled = local.disabled;
    element.multiple = local.multiple;
    element.onValueChange = local.onValueChange;
    element.value = local.value;
  });
  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);
  onCleanup(() => {
    setRenderableRef(ref, undefined);
    element.endCoordinationLifetime();
    store.destroy();
  });
  let content: JSX.Element;
  let contentInitialized = false;
  return createComponent(StoreContext.Provider, {
    value: store,
    get children() {
      if (!contentInitialized) {
        contentInitialized = true;
        content = untrack(() => {
          const child = local.children;
          return typeof child === "function" ? child(publicState) : child;
        });
      }
      spreadRenderableProps(element, () => ({ ...renderableProps }));
      spreadRenderableProps(element, () => ({ children: content }));
      return element;
    },
  });
}

/** Solid Accordion Item adapter. */
export function Item(props: Item.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useStore("Item");
  const [local, renderableProps] = splitProps(props, [
    "children",
    "disabled",
    "onOpenChange",
    "ref",
    "value",
  ]);
  const element = new AccordionItemRenderable(
    renderer,
    untrack(() => ({
      ...renderableProps,
      disabled: local.disabled,
      onOpenChange: local.onOpenChange,
      store,
      value: local.value,
    })),
  );
  const state = createRenderableState(element, element.getState());
  const publicState: AccordionItemState = {
    get disabled() {
      return state().disabled;
    },
    get open() {
      return state().open;
    },
    get value() {
      return state().value;
    },
  };
  createEffect(() => {
    element.disabled = local.disabled;
    element.onOpenChange = local.onOpenChange;
    element.value = local.value;
  });
  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);
  onCleanup(() => {
    setRenderableRef(ref, undefined);
    element.endCoordinationLifetime();
  });
  let content: JSX.Element;
  let contentInitialized = false;
  return createComponent(ItemContext.Provider, {
    value: element,
    get children() {
      if (!contentInitialized) {
        contentInitialized = true;
        content = untrack(() => {
          const child = local.children;
          return typeof child === "function" ? child(publicState) : child;
        });
      }
      spreadRenderableProps(element, () => ({ ...renderableProps }));
      spreadRenderableProps(element, () => ({ children: content }));
      return element;
    },
  });
}

/** Solid Accordion Trigger adapter. */
export function Trigger(props: Trigger.Props): JSX.Element {
  const renderer = useRenderer();
  const item = useItem("Trigger");
  const [local, renderableProps] = splitProps(props, ["children", "ref"]);
  const element = new AccordionTriggerRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, item })),
  );
  const state = createRenderableState(element, element.getState());
  const publicState: AccordionTriggerState = {
    get disabled() {
      return state().disabled;
    },
    get focused() {
      return state().focused;
    },
    get open() {
      return state().open;
    },
    get value() {
      return state().value;
    },
  };
  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);
  onCleanup(() => setRenderableRef(ref, undefined));
  const content = untrack(() => {
    const child = local.children;
    return typeof child === "function" ? child(publicState) : child;
  });
  spreadRenderableProps(element, () => ({
    ...renderableProps,
    children: content,
  }));
  return element;
}

/** Solid Accordion Panel adapter with optional retained mounting. */
export function Panel(props: Panel.Props): JSX.Element {
  const renderer = useRenderer();
  const item = useItem("Panel");
  const itemState = createRenderableState(item, item.getState());
  const [local, renderableProps] = splitProps(props, [
    "children",
    "keepMounted",
    "ref",
  ]);
  return createComponent(Show, {
    keyed: true,
    get when() {
      return local.keepMounted || itemState().open;
    },
    get children() {
      const element = new AccordionPanelRenderable(
        renderer,
        untrack(() => ({ ...renderableProps, item })),
      );
      const state = createRenderableState(element, element.getState());
      const publicState: AccordionPanelState = {
        get disabled() {
          return state().disabled;
        },
        get open() {
          return state().open;
        },
        get value() {
          return state().value;
        },
      };
      const ref = untrack(() => local.ref);
      setRenderableRef(ref, element);
      onCleanup(() => setRenderableRef(ref, undefined));
      const content = untrack(() => {
        const child = local.children;
        return typeof child === "function" ? child(publicState) : child;
      });
      spreadRenderableProps(element, () => ({
        ...renderableProps,
        children: content,
      }));
      return element;
    },
  });
}

/** Types scoped to Accordion.Root. */
export namespace Root {
  export type Props = RootProps;
  export type State = AccordionState;
  export type ChangeDetails = AccordionValueChangeDetails;
  export type ValueChangeHandler = AccordionValueChangeHandler;
}

/** Types scoped to Accordion.Item. */
export namespace Item {
  export type Props = ItemProps;
  export type State = AccordionItemState;
  export type OpenChangeHandler = AccordionItemOpenChangeHandler;
}

/** Types scoped to Accordion.Trigger. */
export namespace Trigger {
  export type Props = TriggerProps;
  export type State = AccordionTriggerState;
}

/** Types scoped to Accordion.Panel. */
export namespace Panel {
  export type Props = PanelProps;
  export type State = AccordionPanelState;
}
