import { extend } from "@opentui/react";
import {
  type NumberFieldChangeDetails,
  type NumberFieldDecrementOptions,
  NumberFieldDecrementRenderable,
  type NumberFieldIncrementOptions,
  NumberFieldIncrementRenderable,
  type NumberFieldInputOptions,
  NumberFieldInputRenderable,
  type NumberFieldRootOptions,
  NumberFieldRootRenderable,
  type NumberFieldScrubAreaOptions,
  NumberFieldScrubAreaRenderable,
  type NumberFieldState,
  type NumberFieldStepState,
  NumberFieldStore,
  type NumberFieldValueChangeHandler,
  type NumberFieldValueCommitHandler,
} from "@tuiparts/core/number-field";
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

const ROOT_TAG = "otui-number-field-root";
const INPUT_TAG = "otui-number-field-input";
const INCREMENT_TAG = "otui-number-field-increment";
const DECREMENT_TAG = "otui-number-field-decrement";
const SCRUB_AREA_TAG = "otui-number-field-scrub-area";

const NumberFieldContext = createContext<NumberFieldStore | null>(null);
const ENABLED_STEP_STATE = Object.freeze<NumberFieldStepState>({
  disabled: false,
});
const DISABLED_STEP_STATE = Object.freeze<NumberFieldStepState>({
  disabled: true,
});

extend({
  [ROOT_TAG]: NumberFieldRootRenderable,
  [INPUT_TAG]: NumberFieldInputRenderable,
  [INCREMENT_TAG]: NumberFieldIncrementRenderable,
  [DECREMENT_TAG]: NumberFieldDecrementRenderable,
  [SCRUB_AREA_TAG]: NumberFieldScrubAreaRenderable,
});

function useNumberFieldStore(part: string): NumberFieldStore {
  const store = useContext(NumberFieldContext);
  if (!store)
    throw new Error(
      `NumberField.${part} must be rendered inside NumberField.Root`,
    );
  return store;
}

function useStoreState(store: NumberFieldStore): NumberFieldState {
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
}

function useStepState(
  store: NumberFieldStore,
  direction: 1 | -1,
): NumberFieldStepState {
  const disabled = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.isStepDisabled(direction),
    () => store.isStepDisabled(direction),
  );
  return disabled ? DISABLED_STEP_STATE : ENABLED_STEP_STATE;
}

type RootProps = Omit<NumberFieldRootOptions, "store"> & {
  children?: ReactNode | ((state: NumberFieldState) => ReactNode);
  ref?: Ref<NumberFieldRootRenderable>;
};
type InputProps = Omit<NumberFieldInputOptions, "store"> & {
  ref?: Ref<NumberFieldInputRenderable>;
};
type IncrementProps = Omit<NumberFieldIncrementOptions, "store"> & {
  children?: ReactNode | ((state: NumberFieldStepState) => ReactNode);
  ref?: Ref<NumberFieldIncrementRenderable>;
};
type DecrementProps = Omit<NumberFieldDecrementOptions, "store"> & {
  children?: ReactNode | ((state: NumberFieldStepState) => ReactNode);
  ref?: Ref<NumberFieldDecrementRenderable>;
};
type ScrubAreaProps = Omit<NumberFieldScrubAreaOptions, "store"> & {
  children?: ReactNode | ((state: NumberFieldState) => ReactNode);
  ref?: Ref<NumberFieldScrubAreaRenderable>;
};

/** React adapter for NumberField Root ownership. */
export function Root({ children, ...props }: Root.Props): ReactElement {
  const {
    defaultValue,
    disabled,
    largeStep,
    max,
    min,
    onValueChange,
    onValueCommit,
    readOnly,
    smallStep,
    step,
    value,
    ...renderableProps
  } = props;
  const [store, state] = useCoreStore<NumberFieldState, NumberFieldStore>(
    () =>
      new NumberFieldStore({
        defaultValue,
        disabled,
        largeStep,
        max,
        min,
        onValueChange,
        onValueCommit,
        readOnly,
        smallStep,
        step,
        value,
      }),
  );
  useLayoutEffect(() => {
    store.setBounds(min, max);
    store.setDisabled(disabled ?? false);
    store.setLargeStep(largeStep ?? 10);
    store.setOnValueChange(onValueChange);
    store.setOnValueCommit(onValueCommit);
    store.setReadOnly(readOnly ?? false);
    store.setSmallStep(smallStep ?? 0.1);
    store.setStep(step ?? 1);
    store.setValue(value);
  }, [
    disabled,
    largeStep,
    max,
    min,
    onValueChange,
    onValueCommit,
    readOnly,
    smallStep,
    step,
    store,
    value,
  ]);
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    NumberFieldContext.Provider,
    { value: store },
    createElement(ROOT_TAG, { ...renderableProps, store }, content),
  );
}

/** React adapter for NumberField Input. */
export function Input(props: Input.Props): ReactElement {
  const store = useNumberFieldStore("Input");
  return createElement(INPUT_TAG, { ...props, store });
}

function useStepPart(
  { children, ...props }: Increment.Props | Decrement.Props,
  direction: 1 | -1,
  part: "Increment" | "Decrement",
  tag: typeof INCREMENT_TAG | typeof DECREMENT_TAG,
): ReactElement {
  const store = useNumberFieldStore(part);
  const state = useStepState(store, direction);
  const content = typeof children === "function" ? children(state) : children;
  return createElement(tag, { ...props, store }, content);
}

/** React adapter for NumberField Increment. */
export function Increment(props: Increment.Props): ReactElement {
  return useStepPart(props, 1, "Increment", INCREMENT_TAG);
}

/** React adapter for NumberField Decrement. */
export function Decrement(props: Decrement.Props): ReactElement {
  return useStepPart(props, -1, "Decrement", DECREMENT_TAG);
}

/** React adapter for NumberField ScrubArea. */
export function ScrubArea({
  children,
  ...props
}: ScrubArea.Props): ReactElement {
  const store = useNumberFieldStore("ScrubArea");
  const state = useStoreState(store);
  const content = typeof children === "function" ? children(state) : children;
  return createElement(SCRUB_AREA_TAG, { ...props, store }, content);
}

Root.displayName = "NumberField.Root";
Input.displayName = "NumberField.Input";
Increment.displayName = "NumberField.Increment";
Decrement.displayName = "NumberField.Decrement";
ScrubArea.displayName = "NumberField.ScrubArea";

/** Types scoped to NumberField.Root. */
export namespace Root {
  export type Props = RootProps;
  export type State = NumberFieldState;
  export type ChangeDetails = NumberFieldChangeDetails;
  export type ValueChangeHandler = NumberFieldValueChangeHandler;
  export type ValueCommitHandler = NumberFieldValueCommitHandler;
}
/** Types scoped to NumberField.Input. */
export namespace Input {
  export type Props = InputProps;
}
/** Types scoped to NumberField.Increment. */
export namespace Increment {
  export type Props = IncrementProps;
  export type State = NumberFieldStepState;
}
/** Types scoped to NumberField.Decrement. */
export namespace Decrement {
  export type Props = DecrementProps;
  export type State = NumberFieldStepState;
}
/** Types scoped to NumberField.ScrubArea. */
export namespace ScrubArea {
  export type Props = ScrubAreaProps;
  export type State = NumberFieldState;
}
