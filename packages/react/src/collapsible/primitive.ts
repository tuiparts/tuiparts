import { extend } from "@opentui/react";
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
  panel: "otui-collapsible-panel",
  root: "otui-collapsible-root",
  trigger: "otui-collapsible-trigger",
} as const;

extend({
  [tags.panel]: CollapsiblePanelRenderable,
  [tags.root]: CollapsibleRootRenderable,
  [tags.trigger]: CollapsibleTriggerRenderable,
});

const StoreContext = createContext<CollapsibleStore | null>(null);

type RootProps = Omit<CollapsibleRootOptions, "store"> & {
  children?: ReactNode | ((state: CollapsibleState) => ReactNode);
  ref?: Ref<CollapsibleRootRenderable>;
};

type TriggerProps = Omit<CollapsibleTriggerOptions, "store"> & {
  children?: ReactNode | ((state: CollapsibleTriggerState) => ReactNode);
  ref?: Ref<CollapsibleTriggerRenderable>;
};

type PanelProps = Omit<CollapsiblePanelOptions, "store"> & {
  children?: ReactNode | ((state: CollapsiblePanelState) => ReactNode);
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

/** React Collapsible Root adapter. */
export function Root({ children, ...props }: Root.Props): ReactElement {
  const [store, state] = useCoreStore<CollapsibleState, CollapsibleStore>(
    () => new CollapsibleStore(props),
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    StoreContext.Provider,
    { value: store },
    createElement(tags.root, { ...props, store }, content),
  );
}

/** React Collapsible Trigger adapter. */
export function Trigger({
  children,
  ref,
  ...props
}: Trigger.Props): ReactElement {
  const store = useStore("Trigger");
  const [trigger, setTrigger] = useState<CollapsibleTriggerRenderable | null>(
    null,
  );
  return createElement(
    tags.trigger,
    { ...props, ref: setTrigger, store },
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
  ref: Ref<CollapsibleTriggerRenderable> | undefined;
  trigger: CollapsibleTriggerRenderable;
}): ReactElement {
  useImperativeHandle(ref, () => trigger, [trigger]);
  const state = useSyncExternalStore(
    (listener) => trigger.subscribe(listener),
    () => trigger.getState(),
    () => trigger.getState(),
  );
  return createElement(
    StoreContext.Provider,
    { value: trigger.store },
    typeof children === "function" ? children(state) : children,
  );
}

/** React Collapsible Panel adapter with optional retained mounting. */
export function Panel({
  children,
  keepMounted = false,
  ref,
  ...props
}: Panel.Props): ReactElement | null {
  const store = useStore("Panel");
  const rootState = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
  if (!keepMounted && !rootState.open) return null;
  const initialState: CollapsiblePanelState = Object.freeze({
    open: rootState.open,
  });
  return createElement(PanelHost, {
    ...props,
    children,
    initialState,
    panelRef: ref,
    store,
  });
}

function PanelHost({
  children,
  initialState,
  panelRef,
  store,
  ...props
}: Omit<Panel.Props, "keepMounted" | "ref"> & {
  initialState: CollapsiblePanelState;
  panelRef: Ref<CollapsiblePanelRenderable> | undefined;
  store: CollapsibleStore;
}): ReactElement {
  const [panel, setPanel] = useState<CollapsiblePanelRenderable | null>(null);
  const handlePanelRef = useCallback(
    (value: CollapsiblePanelRenderable | null) => {
      setPanel(value);
      if (typeof panelRef === "function") panelRef(value);
      else if (panelRef) panelRef.current = value;
    },
    [panelRef],
  );
  const state = useSyncExternalStore(
    (listener) =>
      panel ? panel.subscribe(listener) : store.subscribe(listener),
    () => panel?.getState() ?? initialState,
    () => panel?.getState() ?? initialState,
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    tags.panel,
    { ...props, ref: handlePanelRef, store },
    content,
  );
}

Root.displayName = "Collapsible.Root";
Trigger.displayName = "Collapsible.Trigger";
Panel.displayName = "Collapsible.Panel";

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
