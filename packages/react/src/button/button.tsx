import { extend } from "@opentui/react";
import {
  type ButtonRootOptions,
  ButtonRootRenderable,
  type ButtonState,
  ButtonStore,
} from "@opentui-ui/core/button";
import {
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useRef,
  useSyncExternalStore,
} from "react";

const ROOT_TAG = "otui-button-root";

extend({
  [ROOT_TAG]: ButtonRootRenderable,
});

export type ButtonProps = Omit<ButtonRootOptions, "store"> & {
  children?: ReactNode | ((state: ButtonState) => ReactNode);
  ref?: Ref<ButtonRootRenderable>;
};

function ButtonRoot({ children, ...props }: ButtonProps): ReactElement {
  const storeRef = useRef<ButtonStore | null>(null);
  if (!storeRef.current) storeRef.current = new ButtonStore(props);
  const store = storeRef.current;
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
  const content = typeof children === "function" ? children(state) : children;

  return createElement(ROOT_TAG, { ...props, store }, content);
}

ButtonRoot.displayName = "Button.Root";

export const Button = {
  Root: ButtonRoot,
} as const;
