import { extend } from "@opentui/react";
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
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const ROOT_TAG = "otui-radio-group-root";
const ITEM_TAG = "otui-radio-group-item";
const INDICATOR_TAG = "otui-radio-group-indicator";

class ReactRadioGroupRootRenderable extends RadioGroupRootRenderable {
  override get store(): RadioGroupStore {
    return super.store;
  }
  override set store(store: RadioGroupStore) {
    if (store !== super.store)
      throw new Error("RadioGroup.Root store cannot be replaced");
  }
}

class ReactRadioGroupItemRenderable extends RadioGroupItemRenderable {
  override get store(): RadioGroupStore {
    return super.store;
  }
  override set store(store: RadioGroupStore) {
    if (store !== super.store)
      throw new Error("RadioGroup.Item store cannot be replaced");
  }
}

extend({
  [ROOT_TAG]: ReactRadioGroupRootRenderable,
  [ITEM_TAG]: ReactRadioGroupItemRenderable,
  [INDICATOR_TAG]: RadioGroupIndicatorRenderable,
});

const RadioGroupContext = createContext<RadioGroupStore | null>(null);
const RadioGroupItemContext = createContext<RadioGroupItemRenderable | null>(
  null,
);

export type RadioGroupProps = Omit<RadioGroupRootOptions, "store"> & {
  children?: ReactNode | ((state: RadioGroupState) => ReactNode);
  ref?: Ref<RadioGroupRootRenderable>;
};
export type RadioGroupItemProps = Omit<RadioGroupItemOptions, "store"> & {
  children?: ReactNode | ((state: RadioGroupItemState) => ReactNode);
  ref?: Ref<RadioGroupItemRenderable>;
};
export type RadioGroupIndicatorProps = Omit<
  RadioGroupIndicatorOptions,
  "item"
> & {
  children?: ReactNode;
  keepMounted?: boolean;
  ref?: Ref<RadioGroupIndicatorRenderable>;
};

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

function RadioGroupRoot({ children, ...props }: RadioGroupProps) {
  const storeRef = useRef<RadioGroupStore | null>(null);
  if (!storeRef.current) storeRef.current = new RadioGroupStore(props);
  const store = storeRef.current;
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    RadioGroupContext.Provider,
    { value: store },
    createElement(ROOT_TAG, { ...props, store }, content),
  );
}

function RadioGroupItem({ children, ref, ...props }: RadioGroupItemProps) {
  const store = useContext(RadioGroupContext);
  if (!store)
    throw new Error("RadioGroup.Item must be rendered inside RadioGroup.Root");
  const [item, setItem] = useState<RadioGroupItemRenderable | null>(null);
  const itemRef = useCallback(
    (nextItem: RadioGroupItemRenderable | null) => {
      setItem((current) => (current === nextItem ? current : nextItem));
      setRef(ref, nextItem);
    },
    [ref],
  );
  return createElement(
    ITEM_TAG,
    { ...props, store, ref: itemRef },
    item ? createElement(RadioGroupItemContent, { item, children }) : undefined,
  );
}

function RadioGroupItemContent({
  item,
  children,
}: {
  item: RadioGroupItemRenderable;
  children: RadioGroupItemProps["children"];
}): ReactElement {
  const state = useSyncExternalStore(
    (listener) => item.subscribe(listener),
    () => item.getState(),
    () => item.getState(),
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    RadioGroupItemContext.Provider,
    { value: item },
    content,
  );
}

function RadioGroupIndicator({
  children,
  keepMounted = false,
  ...props
}: RadioGroupIndicatorProps): ReactElement | null {
  const item = useContext(RadioGroupItemContext);
  if (!item)
    throw new Error(
      "RadioGroup.Indicator must be rendered inside RadioGroup.Item",
    );
  const state = useSyncExternalStore(
    (listener) => item.subscribe(listener),
    () => item.getState(),
    () => item.getState(),
  );
  if (!keepMounted && !state.selected) return null;
  return createElement(INDICATOR_TAG, { ...props, item }, children);
}

RadioGroupRoot.displayName = "RadioGroup.Root";
RadioGroupItem.displayName = "RadioGroup.Item";
RadioGroupIndicator.displayName = "RadioGroup.Indicator";

export const RadioGroup = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
} as const;
