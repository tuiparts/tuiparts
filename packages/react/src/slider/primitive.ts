import { extend } from "@opentui/react";
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
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
} from "react";
import { useCoreStore } from "../internal/use-core-store";

const ROOT_TAG = "otui-slider-root";
const TRACK_TAG = "otui-slider-track";
const RANGE_TAG = "otui-slider-range";
const THUMB_TAG = "otui-slider-thumb";

const SliderContext = createContext<SliderStore | null>(null);

extend({
  [ROOT_TAG]: SliderRootRenderable,
  [TRACK_TAG]: SliderTrackRenderable,
  [RANGE_TAG]: SliderRangeRenderable,
  [THUMB_TAG]: SliderThumbRenderable,
});

function useSliderStore(part: string): SliderStore {
  const store = useContext(SliderContext);
  if (!store)
    throw new Error(`Slider.${part} must be rendered inside Slider.Root`);
  return store;
}

function useStoreState(store: SliderStore): SliderState {
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
}

type StateChildren = ReactNode | ((state: SliderState) => ReactNode);

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

/** React adapter for Slider Root ownership. */
export function Root({ children, ...props }: Root.Props): ReactElement {
  const {
    defaultValue,
    disabled,
    largeStep,
    max,
    min,
    onValueChange,
    onValueCommit,
    orientation,
    readOnly,
    step,
    value,
    ...renderableProps
  } = props;
  const [store, state] = useCoreStore<SliderState, SliderStore>(
    () =>
      new SliderStore({
        defaultValue,
        disabled,
        largeStep,
        max,
        min,
        onValueChange,
        onValueCommit,
        orientation,
        readOnly,
        step,
        value,
      }),
  );
  useLayoutEffect(() => {
    store.setBounds(min ?? 0, max ?? 100);
    store.setDisabled(disabled ?? false);
    store.setLargeStep(largeStep ?? 10);
    store.setOnValueChange(onValueChange);
    store.setOnValueCommit(onValueCommit);
    store.setOrientation(orientation ?? "horizontal");
    store.setReadOnly(readOnly ?? false);
    store.setStep(step ?? 1);
    store.setValue(value);
  }, [
    disabled,
    largeStep,
    max,
    min,
    onValueChange,
    onValueCommit,
    orientation,
    readOnly,
    step,
    store,
    value,
  ]);
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    SliderContext.Provider,
    { value: store },
    createElement(ROOT_TAG, { ...renderableProps, store }, content),
  );
}

function useStatePart(
  part: "Track" | "Range" | "Thumb",
  tag: typeof TRACK_TAG | typeof RANGE_TAG | typeof THUMB_TAG,
  props: Track.Props | Range.Props | Thumb.Props,
): ReactElement {
  const { children, ...renderableProps } = props;
  const store = useSliderStore(part);
  const state = useStoreState(store);
  const content = typeof children === "function" ? children(state) : children;
  return createElement(tag, { ...renderableProps, store }, content);
}

/** React adapter for Slider Track. */
export function Track(props: Track.Props): ReactElement {
  return useStatePart("Track", TRACK_TAG, props);
}

/** React adapter for Slider Range. */
export function Range(props: Range.Props): ReactElement {
  return useStatePart("Range", RANGE_TAG, props);
}

/** React adapter for Slider Thumb. */
export function Thumb(props: Thumb.Props): ReactElement {
  return useStatePart("Thumb", THUMB_TAG, props);
}

Root.displayName = "Slider.Root";
Track.displayName = "Slider.Track";
Range.displayName = "Slider.Range";
Thumb.displayName = "Slider.Thumb";

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
