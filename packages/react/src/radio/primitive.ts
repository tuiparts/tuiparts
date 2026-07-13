import { extend } from "@opentui/react";
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
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const ROOT_TAG = "otui-radio-group-root";
const ITEM_TAG = "otui-radio-group-item";
const INDICATOR_TAG = "otui-radio-group-indicator";

extend({
  [ROOT_TAG]: RadioGroupRootRenderable,
  [ITEM_TAG]: RadioGroupItemRenderable,
  [INDICATOR_TAG]: RadioGroupIndicatorRenderable,
});

const RadioGroupContext = createContext<RadioGroupStore | null>(null);
const RadioGroupItemContext = createContext<RadioGroupItemRenderable | null>(
  null,
);

type RootProps = Omit<RadioGroupRootOptions, "store"> & {
  children?: ReactNode | ((state: RadioGroupState) => ReactNode);
  ref?: Ref<RadioGroupRootRenderable>;
};
type ItemProps = Omit<RadioGroupItemOptions, "store"> & {
  children?: ReactNode | ((state: RadioGroupItemState) => ReactNode);
  ref?: Ref<RadioGroupItemRenderable>;
};
type IndicatorProps = Omit<RadioGroupIndicatorOptions, "item"> & {
  children?: ReactNode;
  keepMounted?: boolean;
  ref?: Ref<RadioGroupIndicatorRenderable>;
};

export function Root({ children, ...props }: Root.Props) {
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

export function Item({ children, ref, ...props }: Item.Props) {
  const store = useContext(RadioGroupContext);
  if (!store)
    throw new Error("RadioGroup.Item must be rendered inside RadioGroup.Root");
  const [item, setItem] = useState<RadioGroupItemRenderable | null>(null);
  useImperativeHandle(ref, () => item as RadioGroupItemRenderable, [item]);
  return createElement(
    ITEM_TAG,
    { ...props, store, ref: setItem },
    item ? createElement(ItemContent, { item, children }) : undefined,
  );
}

function ItemContent({
  item,
  children,
}: {
  item: RadioGroupItemRenderable;
  children: Item.Props["children"];
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

export function Indicator({
  children,
  keepMounted = false,
  ...props
}: Indicator.Props): ReactElement | null {
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

Root.displayName = "RadioGroup.Root";
Item.displayName = "RadioGroup.Item";
Indicator.displayName = "RadioGroup.Indicator";

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
