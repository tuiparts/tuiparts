import { extend } from "@opentui/react";
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
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useCoreStore } from "../internal/use-core-store";

const tags = {
  list: "otui-tabs-list",
  panel: "otui-tabs-panel",
  root: "otui-tabs-root",
  tab: "otui-tabs-tab",
} as const;

extend({
  [tags.list]: TabsListRenderable,
  [tags.panel]: TabsPanelRenderable,
  [tags.root]: TabsRootRenderable,
  [tags.tab]: TabsTabRenderable,
});

const StoreContext = createContext<TabsStore | null>(null);

type RootProps = Omit<TabsRootOptions, "store"> & {
  children?: ReactNode | ((state: TabsState) => ReactNode);
  ref?: Ref<TabsRootRenderable>;
};
type ListProps = Omit<TabsListOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<TabsListRenderable>;
};
type TabProps = Omit<TabsTabOptions, "store"> & {
  children?: ReactNode | ((state: TabsTabState) => ReactNode);
  ref?: Ref<TabsTabRenderable>;
};
type PanelProps = Omit<TabsPanelOptions, "store"> & {
  children?: ReactNode | ((state: TabsPanelState) => ReactNode);
  keepMounted?: boolean;
  ref?: Ref<TabsPanelRenderable>;
};

function useStore(part: string): TabsStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error(`Tabs.${part} must be rendered inside Tabs.Root`);
  return store;
}

/** React Tabs Root adapter. */
export function Root({ children, ref, ...props }: Root.Props): ReactElement {
  const [store, state] = useCoreStore<TabsState, TabsStore>(
    () => new TabsStore(props),
  );
  const content = typeof children === "function" ? children(state) : children;
  const destroyStore = useCallback(() => store.destroy(), [store]);
  const handleRootRef = useCallback(
    (root: TabsRootRenderable | null) => {
      if (root) {
        root.off("destroyed", destroyStore);
        root.once("destroyed", destroyStore);
      }
      if (typeof ref === "function") ref(root);
      else if (ref) ref.current = root;
    },
    [destroyStore, ref],
  );
  return createElement(
    StoreContext.Provider,
    { value: store },
    createElement(tags.root, { ...props, ref: handleRootRef, store }, content),
  );
}

/** React Tabs List adapter. */
export function List({ children, ...props }: List.Props): ReactElement {
  return createElement(
    tags.list,
    { ...props, store: useStore("List") },
    children,
  );
}

/** React Tabs Tab adapter. */
export function Tab({ children, ref, ...props }: Tab.Props): ReactElement {
  const store = useStore("Tab");
  const [tab, setTab] = useState<TabsTabRenderable | null>(null);
  return createElement(
    tags.tab,
    { ...props, ref: setTab, store },
    tab ? createElement(TabContent, { children, ref, tab }) : undefined,
  );
}

function TabContent({
  children,
  ref,
  tab,
}: {
  children: Tab.Props["children"];
  ref: Ref<TabsTabRenderable> | undefined;
  tab: TabsTabRenderable;
}): ReactElement {
  useImperativeHandle(ref, () => tab, [tab]);
  const state = useSyncExternalStore(
    (listener) => tab.subscribe(listener),
    () => tab.getState(),
    () => tab.getState(),
  );
  return createElement(
    StoreContext.Provider,
    { value: tab.store },
    typeof children === "function" ? children(state) : children,
  );
}

/** React Tabs Panel adapter with optional retained mounting. */
export function Panel({
  children,
  keepMounted = false,
  ref,
  value,
  ...props
}: Panel.Props): ReactElement | null {
  const store = useStore("Panel");
  const rootState = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
  if (!keepMounted && rootState.value !== value) return null;
  return createElement(PanelHost, {
    ...props,
    children,
    panelRef: ref,
    store,
    value,
  });
}

function PanelHost({
  children,
  panelRef,
  store,
  ...props
}: Omit<Panel.Props, "keepMounted" | "ref"> & {
  panelRef: Ref<TabsPanelRenderable> | undefined;
  store: TabsStore;
}): ReactElement {
  const [panel, setPanel] = useState<TabsPanelRenderable | null>(null);
  const handlePanelRef = useCallback(
    (value: TabsPanelRenderable | null) => {
      setPanel(value);
      if (typeof panelRef === "function") panelRef(value);
      else if (panelRef) panelRef.current = value;
    },
    [panelRef],
  );
  const fallbackState = useMemo<TabsPanelState>(
    () =>
      Object.freeze({
        active: store.state.value === props.value,
        associated: store.hasAvailableTab(props.value),
        value: props.value,
      }),
    [props.value, store],
  );
  const state = useSyncExternalStore(
    (listener) =>
      panel ? panel.subscribe(listener) : store.subscribe(listener),
    () => panel?.getState() ?? fallbackState,
    () => panel?.getState() ?? fallbackState,
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    tags.panel,
    { ...props, ref: handlePanelRef, store },
    content,
  );
}

Root.displayName = "Tabs.Root";
List.displayName = "Tabs.List";
Tab.displayName = "Tabs.Tab";
Panel.displayName = "Tabs.Panel";

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
