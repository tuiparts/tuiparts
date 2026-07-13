import { extend } from "@opentui/react";
import {
  type SwitchPrimitiveState,
  type SwitchRootOptions,
  SwitchRootRenderable,
  SwitchStore,
  type SwitchThumbOptions,
  SwitchThumbRenderable,
} from "@opentui-ui/core/switch";
import {
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";

const ROOT_TAG = "otui-switch-primitive-root";
const THUMB_TAG = "otui-switch-primitive-thumb";

extend({
  [ROOT_TAG]: SwitchRootRenderable,
  [THUMB_TAG]: SwitchThumbRenderable,
});

const SwitchContext = createContext<SwitchStore | null>(null);

export type SwitchPrimitiveRootProps = Omit<SwitchRootOptions, "store"> & {
  children?: ReactNode | ((state: SwitchPrimitiveState) => ReactNode);
  ref?: Ref<SwitchRootRenderable>;
};

export type SwitchPrimitiveThumbProps = Omit<SwitchThumbOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<SwitchThumbRenderable>;
};

function SwitchRoot({
  children,
  ...props
}: SwitchPrimitiveRootProps): ReactElement {
  const storeRef = useRef<SwitchStore | null>(null);
  if (!storeRef.current) storeRef.current = new SwitchStore(props);
  const store = storeRef.current;
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
  const content = typeof children === "function" ? children(state) : children;

  return createElement(
    SwitchContext.Provider,
    { value: store },
    createElement(ROOT_TAG, { ...props, store }, content),
  );
}

function SwitchThumb({
  children,
  ...props
}: SwitchPrimitiveThumbProps): ReactElement {
  const store = useContext(SwitchContext);
  if (!store) {
    throw new Error(
      "SwitchPrimitive.Thumb must be rendered inside SwitchPrimitive.Root",
    );
  }
  return createElement(THUMB_TAG, { ...props, store }, children);
}

SwitchRoot.displayName = "SwitchPrimitive.Root";
SwitchThumb.displayName = "SwitchPrimitive.Thumb";

export const SwitchPrimitive = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
} as const;
