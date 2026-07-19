import { extend } from "@opentui/react";
import {
  type ButtonOptions,
  type ButtonPressDetails,
  ButtonRenderable,
  type ButtonState,
  ButtonStore,
} from "@tuiparts/core/button";
import {
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { useCoreStore } from "../internal/use-core-store";

const BUTTON_TAG = "otui-button";

extend({
  [BUTTON_TAG]: ButtonRenderable,
});

type ButtonProps = Omit<ButtonOptions, "store"> & {
  children?: ReactNode | ((state: ButtonState) => ReactNode);
  ref?: Ref<ButtonRenderable>;
};

export function Button({ children, ...props }: Button.Props): ReactElement {
  const [store, state] = useCoreStore<ButtonState, ButtonStore>(
    () => new ButtonStore(props),
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
