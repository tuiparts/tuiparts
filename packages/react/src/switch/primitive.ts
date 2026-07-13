import { extend } from "@opentui/react";
import {
  type SwitchRootOptions,
  SwitchRootRenderable,
  type SwitchState,
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

type RootProps = Omit<SwitchRootOptions, "store"> & {
  children?: ReactNode | ((state: SwitchState) => ReactNode);
  ref?: Ref<SwitchRootRenderable>;
};

type ThumbProps = Omit<SwitchThumbOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<SwitchThumbRenderable>;
};

export function Root({ children, ...props }: Root.Props): ReactElement {
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

export function Thumb({ children, ...props }: Thumb.Props): ReactElement {
  const store = useContext(SwitchContext);
  if (!store) {
    throw new Error("Switch.Thumb must be rendered inside Switch.Root");
  }
  return createElement(THUMB_TAG, { ...props, store }, children);
}

Root.displayName = "Switch.Root";
Thumb.displayName = "Switch.Thumb";

export namespace Root {
  export type Props = RootProps;
  export type State = SwitchState;
}

export namespace Thumb {
  export type Props = ThumbProps;
}
