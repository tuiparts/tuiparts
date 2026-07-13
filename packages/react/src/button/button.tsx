import { extend } from "@opentui/react";
import {
  type ButtonOptions,
  type ButtonPressDetails,
  ButtonRenderable,
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

const BUTTON_TAG = "otui-button";

extend({
  [BUTTON_TAG]: ButtonRenderable,
});

type ButtonProps = Omit<ButtonOptions, "store"> & {
  children?: ReactNode | ((state: ButtonState) => ReactNode);
  ref?: Ref<ButtonRenderable>;
};

export function Button({ children, ...props }: Button.Props): ReactElement {
  const storeRef = useRef<ButtonStore | null>(null);
  if (!storeRef.current) storeRef.current = new ButtonStore(props);
  const store = storeRef.current;
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(BUTTON_TAG, { ...props, store }, content);
}

Button.displayName = "Button";

export namespace Button {
  export type Props = ButtonProps;
  export type State = ButtonState;
  export type PressDetails = ButtonPressDetails;
}
