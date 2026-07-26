import { extend } from "@opentui/react";
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
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useImperativeHandle,
  useState,
  useSyncExternalStore,
} from "react";
import { useCoreStore } from "../internal/use-core-store";

const tags = {
  item: "otui-accordion-item",
  panel: "otui-accordion-panel",
  root: "otui-accordion-root",
  trigger: "otui-accordion-trigger",
} as const;

extend({
  [tags.item]: AccordionItemRenderable,
  [tags.panel]: AccordionPanelRenderable,
  [tags.root]: AccordionRootRenderable,
  [tags.trigger]: AccordionTriggerRenderable,
});

const StoreContext = createContext<AccordionStore | null>(null);
const ItemContext = createContext<AccordionItemRenderable | null>(null);

type RootProps = Omit<AccordionRootOptions, "store"> & {
  children?: ReactNode | ((state: AccordionState) => ReactNode);
  ref?: Ref<AccordionRootRenderable>;
};

type ItemProps = Omit<AccordionItemOptions, "store"> & {
  children?: ReactNode | ((state: AccordionItemState) => ReactNode);
  ref?: Ref<AccordionItemRenderable>;
};

type TriggerProps = Omit<AccordionTriggerOptions, "item"> & {
  children?: ReactNode | ((state: AccordionTriggerState) => ReactNode);
  ref?: Ref<AccordionTriggerRenderable>;
};

type PanelProps = Omit<AccordionPanelOptions, "item"> & {
  children?: ReactNode | ((state: AccordionPanelState) => ReactNode);
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

/** React Accordion Root adapter. */
export function Root({ children, ...props }: Root.Props): ReactElement {
  const [store, state] = useCoreStore<AccordionState, AccordionStore>(
    () => new AccordionStore(props),
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    StoreContext.Provider,
    { value: store },
    createElement(tags.root, { ...props, store }, content),
  );
}

/** React Accordion Item adapter. */
export function Item({ children, ref, ...props }: Item.Props): ReactElement {
  const store = useStore("Item");
  const [item, setItem] = useState<AccordionItemRenderable | null>(null);
  return createElement(
    tags.item,
    { ...props, ref: setItem, store },
    item ? createElement(ItemContent, { children, item, ref }) : undefined,
  );
}

function ItemContent({
  children,
  item,
  ref,
}: {
  children: Item.Props["children"];
  item: AccordionItemRenderable;
  ref: Ref<AccordionItemRenderable> | undefined;
}): ReactElement {
  useImperativeHandle(ref, () => item, [item]);
  const state = useSyncExternalStore(
    (listener) => item.subscribe(listener),
    () => item.getState(),
    () => item.getState(),
  );
  return createElement(
    ItemContext.Provider,
    { value: item },
    typeof children === "function" ? children(state) : children,
  );
}

/** React Accordion Trigger adapter. */
export function Trigger({
  children,
  ref,
  ...props
}: Trigger.Props): ReactElement {
  const item = useItem("Trigger");
  const [trigger, setTrigger] = useState<AccordionTriggerRenderable | null>(
    null,
  );
  return createElement(
    tags.trigger,
    { ...props, item, ref: setTrigger },
    trigger
      ? createElement(TriggerContent, { children, ref, trigger })
      : undefined,
  );
}

function TriggerContent({
  children,
  ref,
  trigger,
}: {
  children: Trigger.Props["children"];
  ref: Ref<AccordionTriggerRenderable> | undefined;
  trigger: AccordionTriggerRenderable;
}): ReactElement {
  useImperativeHandle(ref, () => trigger, [trigger]);
  const state = useSyncExternalStore(
    (listener) => trigger.subscribe(listener),
    () => trigger.getState(),
    () => trigger.getState(),
  );
  return createElement(
    ItemContext.Provider,
    { value: trigger.item },
    typeof children === "function" ? children(state) : children,
  );
}

/** React Accordion Panel adapter with optional retained mounting. */
export function Panel({
  children,
  keepMounted = false,
  ref,
  ...props
}: Panel.Props): ReactElement | null {
  const item = useItem("Panel");
  const itemState = useSyncExternalStore(
    (listener) => item.subscribe(listener),
    () => item.getState(),
    () => item.getState(),
  );
  if (!keepMounted && !itemState.open) return null;
  return createElement(PanelHost, {
    ...props,
    children,
    initialState: itemState,
    item,
    panelRef: ref,
  });
}

function PanelHost({
  children,
  initialState,
  item,
  panelRef,
  ...props
}: Omit<Panel.Props, "keepMounted" | "ref"> & {
  initialState: AccordionPanelState;
  item: AccordionItemRenderable;
  panelRef: Ref<AccordionPanelRenderable> | undefined;
}): ReactElement {
  const [panel, setPanel] = useState<AccordionPanelRenderable | null>(null);
  const handlePanelRef = useCallback(
    (value: AccordionPanelRenderable | null) => {
      setPanel(value);
      if (typeof panelRef === "function") panelRef(value);
      else if (panelRef) panelRef.current = value;
    },
    [panelRef],
  );
  const state = useSyncExternalStore(
    (listener) =>
      panel ? panel.subscribe(listener) : item.subscribe(listener),
    () => panel?.getState() ?? initialState,
    () => panel?.getState() ?? initialState,
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    tags.panel,
    { ...props, item, ref: handlePanelRef },
    content,
  );
}

Root.displayName = "Accordion.Root";
Item.displayName = "Accordion.Item";
Trigger.displayName = "Accordion.Trigger";
Panel.displayName = "Accordion.Panel";

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
