import { extend } from "@opentui/react";
import {
  type ButtonOptions,
  ButtonRenderable,
  type ButtonState,
} from "@opentui-ui/core/button";
import {
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useState,
  useSyncExternalStore,
} from "react";

const BUTTON_TAG = "otui-button";

extend({
  [BUTTON_TAG]: ButtonRenderable,
});

export type ButtonProps = ButtonOptions & {
  children?: ReactNode | ((state: ButtonState) => ReactNode);
  ref?: Ref<ButtonRenderable>;
};

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

function ButtonContent({
  button,
  children,
}: {
  button: ButtonRenderable;
  children: ButtonProps["children"];
}): ReactNode {
  const state = useSyncExternalStore(
    (listener) => button.subscribe(listener),
    () => button.getState(),
    () => button.getState(),
  );
  return typeof children === "function" ? children(state) : children;
}

export function Button({ children, ref, ...props }: ButtonProps): ReactElement {
  const [button, setButton] = useState<ButtonRenderable | null>(null);
  const buttonRef = useCallback(
    (nextButton: ButtonRenderable | null) => {
      setButton((current) => (current === nextButton ? current : nextButton));
      setRef(ref, nextButton);
    },
    [ref],
  );

  return createElement(
    BUTTON_TAG,
    { ...props, ref: buttonRef },
    button ? createElement(ButtonContent, { button, children }) : undefined,
  );
}

Button.displayName = "Button";
