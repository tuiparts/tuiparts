import type { RenderContext } from "@opentui/core";
import { extend } from "@opentui/react";
import { SwitchStateController } from "@opentui-ui/core/_internal/switch";
import {
  type SwitchRootOptions,
  SwitchRootRenderable,
  type SwitchState,
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

type AdapterRootOptions = SwitchRootOptions & {
  controller: SwitchStateController;
};
type AdapterThumbOptions = Omit<SwitchThumbOptions, "root"> & {
  controller: SwitchStateController;
};

class ReactSwitchRootRenderable extends SwitchRootRenderable {
  private _adapterController: SwitchStateController;

  constructor(ctx: RenderContext, options: AdapterRootOptions) {
    const { controller, ...rootOptions } = options;
    super(ctx, rootOptions);
    this._adapterController = controller;
    this.setStateController(controller);
  }

  get controller(): SwitchStateController {
    return this._adapterController;
  }

  set controller(controller: SwitchStateController) {
    this._adapterController = controller;
    this.setStateController(controller);
  }
}

class ReactSwitchThumbRenderable extends SwitchThumbRenderable {
  private _adapterController: SwitchStateController;

  constructor(ctx: RenderContext, options: AdapterThumbOptions) {
    const { controller, ...thumbOptions } = options;
    super(ctx, {
      ...thumbOptions,
      root: controller as unknown as SwitchRootRenderable,
    });
    this._adapterController = controller;
  }

  get controller(): SwitchStateController {
    return this._adapterController;
  }

  set controller(controller: SwitchStateController) {
    this._adapterController = controller;
    this.setStateOwner(controller);
  }
}

extend({
  [ROOT_TAG]: ReactSwitchRootRenderable,
  [THUMB_TAG]: ReactSwitchThumbRenderable,
});

const SwitchContext = createContext<SwitchStateController | null>(null);

export type SwitchProps = SwitchRootOptions & {
  children?: ReactNode | ((state: SwitchState) => ReactNode);
  ref?: Ref<SwitchRootRenderable>;
};

export type SwitchThumbProps = Omit<SwitchThumbOptions, "root"> & {
  children?: ReactNode;
  ref?: Ref<SwitchThumbRenderable>;
};

function SwitchRoot({ children, ...props }: SwitchProps): ReactElement {
  const controllerRef = useRef<SwitchStateController | null>(null);
  if (!controllerRef.current)
    controllerRef.current = new SwitchStateController(props);
  const controller = controllerRef.current;
  const state = useSyncExternalStore(
    (listener) => controller.subscribe(listener),
    () => controller.state,
    () => controller.state,
  );
  const content = typeof children === "function" ? children(state) : children;

  return createElement(
    SwitchContext.Provider,
    { value: controller },
    createElement(ROOT_TAG, { ...props, controller }, content),
  );
}

function SwitchThumb({ children, ...props }: SwitchThumbProps): ReactElement {
  const controller = useContext(SwitchContext);
  if (!controller) {
    throw new Error("Switch.Thumb must be rendered inside Switch.Root");
  }
  return createElement(THUMB_TAG, { ...props, controller }, children);
}

SwitchRoot.displayName = "Switch.Root";
SwitchThumb.displayName = "Switch.Thumb";

export const Switch = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
} as const;
