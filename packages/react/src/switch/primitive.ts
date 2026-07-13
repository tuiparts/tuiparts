import { extend } from "@opentui/react";
import {
  type SwitchState,
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

const ROOT_TAG = "otui-switch-root";
const THUMB_TAG = "otui-switch-thumb";

extend({
  [ROOT_TAG]: SwitchRootRenderable,
  [THUMB_TAG]: SwitchThumbRenderable,
});

const SwitchContext = createContext<SwitchStore | null>(null);

export type SwitchProps = Omit<SwitchRootOptions, "store"> & {
  children?: ReactNode | ((state: SwitchState) => ReactNode);
  ref?: Ref<SwitchRootRenderable>;
};

export type SwitchThumbProps = Omit<SwitchThumbOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<SwitchThumbRenderable>;
};

function SwitchRoot({ children, ...props }: SwitchProps): ReactElement {
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

function SwitchThumb({ children, ...props }: SwitchThumbProps): ReactElement {
  const store = useContext(SwitchContext);
  if (!store) {
    throw new Error("Switch.Thumb must be rendered inside Switch.Root");
  }
  return createElement(THUMB_TAG, { ...props, store }, children);
}

SwitchRoot.displayName = "Switch.Root";
SwitchThumb.displayName = "Switch.Thumb";

export const Switch = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
} as const;
