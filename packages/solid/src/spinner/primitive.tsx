/** @jsxImportSource @opentui/solid */

import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type SpinnerFrameChangeDetails,
  type SpinnerFrameChangeHandler,
  type SpinnerIndicatorOptions,
  SpinnerIndicatorRenderable,
  type SpinnerLabelOptions,
  SpinnerLabelRenderable,
  type SpinnerPreset,
  type SpinnerRootOptions,
  SpinnerRootRenderable,
  type SpinnerState,
  SpinnerStore,
} from "@tuiparts/core/spinner";
import {
  createComponent,
  createContext,
  createEffect,
  onCleanup,
  type Ref,
  splitProps,
  untrack,
  useContext,
} from "solid-js";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";
import { createRenderableState } from "../internal/renderable-state";

const StoreContext = createContext<SpinnerStore>();

function useStore(part: string): SpinnerStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(`Spinner.${part} must be rendered inside Spinner.Root`);
  }
  return store;
}

type RootProps = Omit<SpinnerRootOptions, "store"> & {
  children?: JSX.Element | ((state: SpinnerState) => JSX.Element);
  ref?: Ref<SpinnerRootRenderable>;
};

type IndicatorProps = Omit<SpinnerIndicatorOptions, "store"> & {
  children?: JSX.Element | ((currentFrame: string) => JSX.Element);
  ref?: Ref<SpinnerIndicatorRenderable>;
};

type LabelProps = SpinnerLabelOptions & {
  children?: JSX.Element;
  ref?: Ref<SpinnerLabelRenderable>;
};

/** Solid Spinner Root adapter. */
export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const store = new SpinnerStore(untrack(() => props));
  const state = createRenderableState(store, store.state);
  const publicState: SpinnerState = {
    get frames() {
      return state().frames;
    },
    get interval() {
      return state().interval;
    },
    get running() {
      return state().running;
    },
    get frameIndex() {
      return state().frameIndex;
    },
    get currentFrame() {
      return state().currentFrame;
    },
  };

  const [local, renderableProps] = splitProps(props, [
    "children",
    "frames",
    "interval",
    "running",
    "onFrameChange",
    "ref",
  ]);

  const element = new SpinnerRootRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );

  createEffect(() => {
    if (local.frames !== undefined) store.setFrames(local.frames);
    if (local.interval !== undefined) store.setInterval(local.interval);
    if (local.running !== undefined) store.setRunning(local.running);
    if (local.onFrameChange !== undefined)
      store.setOnFrameChange(local.onFrameChange);
  });

  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);

  onCleanup(() => {
    setRenderableRef(ref, undefined);
    store.destroy();
  });

  return createComponent(StoreContext.Provider, {
    value: store,
    get children() {
      spreadRenderableProps(element, () => ({ ...renderableProps }));
      spreadRenderableProps(element, () => {
        const child = local.children;
        return {
          children: typeof child === "function" ? child(publicState) : child,
        };
      });
      return element;
    },
  });
}

/** Solid Spinner Indicator adapter. */
export function Indicator(props: Indicator.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useStore("Indicator");
  const state = createRenderableState(store, store.state);
  const [local, renderableProps] = splitProps(props, ["children", "ref"]);

  const element = new SpinnerIndicatorRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );

  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);
  onCleanup(() => setRenderableRef(ref, undefined));

  spreadRenderableProps(element, () => {
    const child = local.children;
    return {
      ...renderableProps,
      children:
        typeof child === "function" ? child(state().currentFrame) : child,
    };
  });

  return element;
}

/** Solid Spinner Label adapter. */
export function Label(props: Label.Props): JSX.Element {
  const renderer = useRenderer();
  const [local, renderableProps] = splitProps(props, ["children", "ref"]);

  const element = new SpinnerLabelRenderable(
    renderer,
    untrack(() => renderableProps),
  );

  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);
  onCleanup(() => setRenderableRef(ref, undefined));

  spreadRenderableProps(element, () => ({
    ...renderableProps,
    children: local.children,
  }));

  return element;
}

export namespace Root {
  export type Props = RootProps;
  export type State = SpinnerState;
  export type Preset = SpinnerPreset;
  export type ChangeDetails = SpinnerFrameChangeDetails;
  export type FrameChangeHandler = SpinnerFrameChangeHandler;
}

export namespace Indicator {
  export type Props = IndicatorProps;
}

export namespace Label {
  export type Props = LabelProps;
}
