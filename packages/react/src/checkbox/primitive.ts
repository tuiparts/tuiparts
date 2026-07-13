import type { RenderContext } from "@opentui/core";
import { extend } from "@opentui/react";
import { CheckboxStateController } from "@opentui-ui/core/_internal/checkbox";
import {
  type CheckboxIndicatorOptions,
  CheckboxIndicatorRenderable,
  type CheckboxRootOptions,
  CheckboxRootRenderable,
  type CheckboxState,
} from "@opentui-ui/core/checkbox";
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

const ROOT_TAG = "otui-checkbox-root";
const INDICATOR_TAG = "otui-checkbox-indicator";

type AdapterRootOptions = CheckboxRootOptions & {
  controller: CheckboxStateController;
};
type AdapterIndicatorOptions = Omit<CheckboxIndicatorOptions, "root"> & {
  controller: CheckboxStateController;
};

class ReactCheckboxRootRenderable extends CheckboxRootRenderable {
  private _adapterController: CheckboxStateController;

  constructor(ctx: RenderContext, options: AdapterRootOptions) {
    const { controller, ...rootOptions } = options;
    super(ctx, rootOptions);
    this._adapterController = controller;
    this.setStateController(controller);
  }

  get controller(): CheckboxStateController {
    return this._adapterController;
  }

  set controller(controller: CheckboxStateController) {
    this._adapterController = controller;
    this.setStateController(controller);
  }
}

class ReactCheckboxIndicatorRenderable extends CheckboxIndicatorRenderable {
  private _adapterController: CheckboxStateController;

  constructor(ctx: RenderContext, options: AdapterIndicatorOptions) {
    const { controller, ...indicatorOptions } = options;
    super(ctx, {
      ...indicatorOptions,
      root: controller as unknown as CheckboxRootRenderable,
    });
    this._adapterController = controller;
  }

  get controller(): CheckboxStateController {
    return this._adapterController;
  }

  set controller(controller: CheckboxStateController) {
    this._adapterController = controller;
    this.setStateOwner(controller);
  }
}

extend({
  [ROOT_TAG]: ReactCheckboxRootRenderable,
  [INDICATOR_TAG]: ReactCheckboxIndicatorRenderable,
});

const CheckboxContext = createContext<CheckboxStateController | null>(null);

export type CheckboxProps = CheckboxRootOptions & {
  children?: ReactNode | ((state: CheckboxState) => ReactNode);
  ref?: Ref<CheckboxRootRenderable>;
};

export type CheckboxIndicatorProps = Omit<CheckboxIndicatorOptions, "root"> & {
  children?: ReactNode;
  ref?: Ref<CheckboxIndicatorRenderable>;
};

function CheckboxRoot({ children, ...props }: CheckboxProps): ReactElement {
  const controllerRef = useRef<CheckboxStateController | null>(null);
  if (!controllerRef.current)
    controllerRef.current = new CheckboxStateController(props);
  const controller = controllerRef.current;
  const state = useSyncExternalStore(
    (listener) => controller.subscribe(listener),
    () => controller.state,
    () => controller.state,
  );
  const content = typeof children === "function" ? children(state) : children;

  return createElement(
    CheckboxContext.Provider,
    { value: controller },
    createElement(ROOT_TAG, { ...props, controller }, content),
  );
}

function CheckboxIndicator({
  children,
  ...props
}: CheckboxIndicatorProps): ReactElement {
  const controller = useContext(CheckboxContext);
  if (!controller) {
    throw new Error("Checkbox.Indicator must be rendered inside Checkbox.Root");
  }
  return createElement(INDICATOR_TAG, { ...props, controller }, children);
}

CheckboxRoot.displayName = "Checkbox.Root";
CheckboxIndicator.displayName = "Checkbox.Indicator";

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
} as const;
