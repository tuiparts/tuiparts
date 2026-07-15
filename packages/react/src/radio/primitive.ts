import { extend } from "@opentui/react";
import {
  type RadioIndicatorOptions,
  RadioIndicatorRenderable,
  type RadioRootOptions,
  RadioRootRenderable,
  type RadioState,
} from "@tuiparts/core/radio";
import {
  type RadioGroupChangeDetails,
  type RadioGroupOptions,
  RadioGroupRenderable,
  type RadioGroupState,
  RadioGroupStore,
  type RadioGroupValueChangeHandler,
} from "@tuiparts/core/radio-group";
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

const GROUP_TAG = "otui-radio-group";
const ROOT_TAG = "otui-radio-root";
const INDICATOR_TAG = "otui-radio-indicator";

extend({
  [GROUP_TAG]: RadioGroupRenderable,
  [ROOT_TAG]: RadioRootRenderable,
  [INDICATOR_TAG]: RadioIndicatorRenderable,
});

const RadioGroupContext = createContext<RadioGroupStore | null>(null);
const RadioContext = createContext<RadioRootRenderable | null>(null);

type RadioGroupProps = Omit<RadioGroupOptions, "store"> & {
  children?: ReactNode | ((state: RadioGroupState) => ReactNode);
  ref?: Ref<RadioGroupRenderable>;
};
type RootProps = Omit<RadioRootOptions, "store"> & {
  children?: ReactNode | ((state: RadioState) => ReactNode);
  ref?: Ref<RadioRootRenderable>;
};
type IndicatorProps = Omit<RadioIndicatorOptions, "radio"> & {
  children?: ReactNode;
  keepMounted?: boolean;
  ref?: Ref<RadioIndicatorRenderable>;
};

export function RadioGroup({ children, ...props }: RadioGroup.Props) {
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
    createElement(GROUP_TAG, { ...props, store }, content),
  );
}

export function Root({ children, ref, ...props }: Root.Props) {
  const store = useContext(RadioGroupContext);
  if (!store) throw new Error("Radio.Root must be rendered inside RadioGroup");
  const [item, setItem] = useState<RadioRootRenderable | null>(null);
  return createElement(
    ROOT_TAG,
    { ...props, store, ref: setItem },
    item ? createElement(RootContent, { item, children, ref }) : undefined,
  );
}

function RootContent({
  item,
  children,
  ref,
}: {
  item: RadioRootRenderable;
  children: Root.Props["children"];
  ref: Ref<RadioRootRenderable> | undefined;
}): ReactElement {
  useImperativeHandle(ref, () => item, [item]);
  const state = useSyncExternalStore(
    (listener) => item.subscribe(listener),
    () => item.getState(),
    () => item.getState(),
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(RadioContext.Provider, { value: item }, content);
}

export function Indicator({
  children,
  keepMounted = false,
  ...props
}: Indicator.Props): ReactElement | null {
  const item = useContext(RadioContext);
  if (!item)
    throw new Error("Radio.Indicator must be rendered inside Radio.Root");
  const state = useSyncExternalStore(
    (listener) => item.subscribe(listener),
    () => item.getState(),
    () => item.getState(),
  );
  if (!keepMounted && !state.checked) return null;
  return createElement(INDICATOR_TAG, { ...props, radio: item }, children);
}

RadioGroup.displayName = "RadioGroup";
Root.displayName = "Radio.Root";
Indicator.displayName = "Radio.Indicator";

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
