import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type SliderChangeDetails,
  type SliderRangeOptions,
  SliderRangeRenderable,
  type SliderRootOptions,
  SliderRootRenderable,
  type SliderState,
  SliderStore,
  type SliderThumbOptions,
  SliderThumbRenderable,
  type SliderTrackOptions,
  SliderTrackRenderable,
  type SliderValueChangeHandler,
  type SliderValueCommitHandler,
} from "@tuiparts/core/slider";
import {
  createComponent,
  createContext,
  createEffect,
  createMemo,
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

const SliderContext = createContext<SliderStore>();

function useSliderStore(part: string): SliderStore {
  const store = useContext(SliderContext);
  if (!store)
    throw new Error(`Slider.${part} must be rendered inside Slider.Root`);
  return store;
}

function stateView(state: () => SliderState): SliderState {
  return Object.freeze({
    get disabled() {
      return state().disabled;
    },
    get dragging() {
      return state().dragging;
    },
    get focused() {
      return state().focused;
    },
    get largeStep() {
      return state().largeStep;
    },
    get max() {
      return state().max;
    },
    get min() {
      return state().min;
    },
    get orientation() {
      return state().orientation;
    },
    get readOnly() {
      return state().readOnly;
    },
    get step() {
      return state().step;
    },
    get value() {
      return state().value;
    },
  });
}

type StateChildren = JSX.Element | ((state: SliderState) => JSX.Element);

type RootProps = Omit<SliderRootOptions, "store"> & {
  children?: StateChildren;
  ref?: Ref<SliderRootRenderable>;
};

type TrackProps = Omit<SliderTrackOptions, "store"> & {
  children?: StateChildren;
  ref?: Ref<SliderTrackRenderable>;
};

type RangeProps = Omit<SliderRangeOptions, "store"> & {
  children?: StateChildren;
  ref?: Ref<SliderRangeRenderable>;
};

type ThumbProps = Omit<SliderThumbOptions, "store"> & {
  children?: StateChildren;
  ref?: Ref<SliderThumbRenderable>;
};

/** Solid adapter for Slider Root ownership. */
export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const store = untrack(
    () =>
      new SliderStore({
        defaultValue: props.defaultValue,
        disabled: props.disabled,
        largeStep: props.largeStep,
        max: props.max,
        min: props.min,
        onValueChange: props.onValueChange,
        onValueCommit: props.onValueCommit,
        orientation: props.orientation,
        readOnly: props.readOnly,
        step: props.step,
        value: props.value,
      }),
  );
  const state = createRenderableState(store, store.state);
  const publicState = stateView(state);
  const [local, renderableProps] = splitProps(props, [
    "children",
    "defaultValue",
    "disabled",
    "largeStep",
    "max",
    "min",
    "onValueChange",
    "onValueCommit",
    "orientation",
    "readOnly",
    "ref",
    "step",
    "value",
  ]);
  const element = new SliderRootRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  createEffect(() => {
    store.setBounds(local.min ?? 0, local.max ?? 100);
    element.disabled = local.disabled;
    element.largeStep = local.largeStep;
    element.onValueChange = local.onValueChange;
    element.onValueCommit = local.onValueCommit;
    element.orientation = local.orientation;
    element.readOnly = local.readOnly;
    element.step = local.step;
    element.value = local.value;
  });
  let renderedChildren: (() => JSX.Element) | undefined;
  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);
  onCleanup(() => {
    setRenderableRef(ref, undefined);
    element.endCoordinationLifetime();
  });
  return createComponent(SliderContext.Provider, {
    value: store,
    get children() {
      renderedChildren ??= createMemo(() => {
        const child = local.children;
        return typeof child === "function"
          ? untrack(() => child(publicState))
          : child;
      });
      spreadRenderableProps(element, () => ({ ...renderableProps }));
      spreadRenderableProps(element, () => ({
        children: renderedChildren?.(),
      }));
      return element;
    },
  });
}

type PartRenderable =
  | SliderTrackRenderable
  | SliderRangeRenderable
  | SliderThumbRenderable;
type PartProps = Track.Props | Range.Props | Thumb.Props;

function createStatePart<T extends PartRenderable>(
  props: PartProps,
  part: "Track" | "Range" | "Thumb",
  create: (store: SliderStore, options: object) => T,
): JSX.Element {
  const store = useSliderStore(part);
  const state = createRenderableState(store, store.state);
  const publicState = stateView(state);
  const [local, renderableProps] = splitProps(props, ["children", "ref"]);
  const element = create(
    store,
    untrack(() => ({ ...renderableProps })),
  );
  // SAFETY: Each Part calls this helper with the matching concrete Renderable,
  // so its public ref target is the same T created above.
  const ref = untrack(() => local.ref as Ref<T>);
  const renderedChildren = createMemo(() => {
    const child = local.children;
    return typeof child === "function"
      ? untrack(() => child(publicState))
      : child;
  });
  setRenderableRef(ref, element);
  onCleanup(() => setRenderableRef(ref, undefined));
  spreadRenderableProps(element, () => ({
    ...renderableProps,
    children: renderedChildren(),
  }));
  return element;
}

/** Solid adapter for Slider Track. */
export function Track(props: Track.Props): JSX.Element {
  const renderer = useRenderer();
  return createStatePart(
    props,
    "Track",
    (store, options) =>
      new SliderTrackRenderable(renderer, { ...options, store }),
  );
}

/** Solid adapter for Slider Range. */
export function Range(props: Range.Props): JSX.Element {
  const renderer = useRenderer();
  return createStatePart(
    props,
    "Range",
    (store, options) =>
      new SliderRangeRenderable(renderer, { ...options, store }),
  );
}

/** Solid adapter for Slider Thumb. */
export function Thumb(props: Thumb.Props): JSX.Element {
  const renderer = useRenderer();
  return createStatePart(
    props,
    "Thumb",
    (store, options) =>
      new SliderThumbRenderable(renderer, { ...options, store }),
  );
}

/** Types scoped to Slider.Root. */
export namespace Root {
  export type Props = RootProps;
  export type State = SliderState;
  export type ChangeDetails = SliderChangeDetails;
  export type ValueChangeHandler = SliderValueChangeHandler;
  export type ValueCommitHandler = SliderValueCommitHandler;
}

/** Types scoped to Slider.Track. */
export namespace Track {
  export type Props = TrackProps;
  export type State = SliderState;
}

/** Types scoped to Slider.Range. */
export namespace Range {
  export type Props = RangeProps;
  export type State = SliderState;
}

/** Types scoped to Slider.Thumb. */
export namespace Thumb {
  export type Props = ThumbProps;
  export type State = SliderState;
}
