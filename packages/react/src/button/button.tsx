import type { RenderContext } from "@opentui/core";
import { extend } from "@opentui/react";
import { ButtonStateController } from "@opentui-ui/core/_internal/button";
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
  useRef,
  useSyncExternalStore,
} from "react";

const BUTTON_TAG = "otui-button";

type AdapterButtonOptions = ButtonOptions & {
  controller: ButtonStateController;
};

class ReactButtonRenderable extends ButtonRenderable {
  private _adapterController: ButtonStateController;

  constructor(ctx: RenderContext, options: AdapterButtonOptions) {
    const { controller, ...buttonOptions } = options;
    super(ctx, buttonOptions);
    this._adapterController = controller;
    this.setStateController(controller);
  }

  get controller(): ButtonStateController {
    return this._adapterController;
  }

  set controller(controller: ButtonStateController) {
    this._adapterController = controller;
    this.setStateController(controller);
  }
}

extend({
  [BUTTON_TAG]: ReactButtonRenderable,
});

export type ButtonProps = ButtonOptions & {
  children?: ReactNode | ((state: ButtonState) => ReactNode);
  ref?: Ref<ButtonRenderable>;
};

export function Button({ children, ...props }: ButtonProps): ReactElement {
  const controllerRef = useRef<ButtonStateController | null>(null);
  if (!controllerRef.current)
    controllerRef.current = new ButtonStateController(props);
  const controller = controllerRef.current;
  const state = useSyncExternalStore(
    (listener) => controller.subscribe(listener),
    () => controller.state,
    () => controller.state,
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(BUTTON_TAG, { ...props, controller }, content);
}

Button.displayName = "Button";
