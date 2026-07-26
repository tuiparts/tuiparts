import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
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

const NumberFieldContext = createContext<NumberFieldStore>();

function useNumberFieldStore(part: string): NumberFieldStore {
  const store = useContext(NumberFieldContext);
  if (!store)
    throw new Error(
      `NumberField.${part} must be rendered inside NumberField.Root`,
    );
  return store;
}

function stateView(state: () => NumberFieldState): NumberFieldState {
  return Object.freeze({
    get disabled() {
      return state().disabled;
    },
    get focused() {
      return state().focused;
    },
    get inputValue() {
      return state().inputValue;
    },
    get readOnly() {
      return state().readOnly;
    },
    get scrubbing() {
      return state().scrubbing;
    },
    get value() {
      return state().value;
    },
  });
}

type RootProps = Omit<NumberFieldRootOptions, "store"> & {
  children?: JSX.Element | ((state: NumberFieldState) => JSX.Element);
  ref?: Ref<NumberFieldRootRenderable>;
};
type InputProps = Omit<NumberFieldInputOptions, "store"> & {
  ref?: Ref<NumberFieldInputRenderable>;
};
type IncrementProps = Omit<NumberFieldIncrementOptions, "store"> & {
  children?: JSX.Element | ((state: NumberFieldStepState) => JSX.Element);
  ref?: Ref<NumberFieldIncrementRenderable>;
};
type DecrementProps = Omit<NumberFieldDecrementOptions, "store"> & {
  children?: JSX.Element | ((state: NumberFieldStepState) => JSX.Element);
  ref?: Ref<NumberFieldDecrementRenderable>;
};
type ScrubAreaProps = Omit<NumberFieldScrubAreaOptions, "store"> & {
  children?: JSX.Element | ((state: NumberFieldState) => JSX.Element);
  ref?: Ref<NumberFieldScrubAreaRenderable>;
};

/** Solid adapter for NumberField Root ownership. */
export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const store = untrack(
    () =>
      new NumberFieldStore({
        defaultValue: props.defaultValue,
        disabled: props.disabled,
        largeStep: props.largeStep,
        max: props.max,
        min: props.min,
        onValueChange: props.onValueChange,
        onValueCommit: props.onValueCommit,
        readOnly: props.readOnly,
        smallStep: props.smallStep,
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
    "readOnly",
    "ref",
    "smallStep",
    "step",
    "value",
  ]);
  const element = new NumberFieldRootRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  createEffect(() => {
    element.disabled = local.disabled;
    element.largeStep = local.largeStep;
    store.setBounds(local.min ?? undefined, local.max ?? undefined);
    element.onValueChange = local.onValueChange;
    element.onValueCommit = local.onValueCommit;
    element.readOnly = local.readOnly;
    element.smallStep = local.smallStep;
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
  return createComponent(NumberFieldContext.Provider, {
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

/** Solid adapter for NumberField Input. */
export function Input(props: Input.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useNumberFieldStore("Input");
  const [local, renderableProps] = splitProps(props, ["ref"]);
  const element = new NumberFieldInputRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);
  onCleanup(() => setRenderableRef(ref, undefined));
  spreadRenderableProps(element, () => renderableProps);
  return element;
}

function createStepPart<
  T extends NumberFieldIncrementRenderable | NumberFieldDecrementRenderable,
>(
  props: Increment.Props | Decrement.Props,
  direction: 1 | -1,
  part: string,
  create: (store: NumberFieldStore, options: object) => T,
): JSX.Element {
  const store = useNumberFieldStore(part);
  const state = createRenderableState(store, store.state);
  const [local, renderableProps] = splitProps(props, ["children", "ref"]);
  const element = create(
    store,
    untrack(() => ({ ...renderableProps })),
  );
  // SAFETY: Increment and Decrement each call this helper with the matching
  // concrete Renderable type, so the union prop ref targets the same T.
  const ref = untrack(() => local.ref as Ref<T>);
  setRenderableRef(ref, element);
  onCleanup(() => setRenderableRef(ref, undefined));
  const publicState: NumberFieldStepState = Object.freeze({
    get disabled() {
      state();
      return store.isStepDisabled(direction);
    },
  });
  const renderedChildren = createMemo(() => {
    const child = local.children;
    return typeof child === "function"
      ? untrack(() => child(publicState))
      : child;
  });
  spreadRenderableProps(element, () => ({
    ...renderableProps,
    children: renderedChildren(),
  }));
  return element;
}

/** Solid adapter for NumberField Increment. */
export function Increment(props: Increment.Props): JSX.Element {
  const renderer = useRenderer();
  return createStepPart(
    props,
    1,
    "Increment",
    (store, options) =>
      new NumberFieldIncrementRenderable(renderer, { ...options, store }),
  );
}
/** Solid adapter for NumberField Decrement. */
export function Decrement(props: Decrement.Props): JSX.Element {
  const renderer = useRenderer();
  return createStepPart(
    props,
    -1,
    "Decrement",
    (store, options) =>
      new NumberFieldDecrementRenderable(renderer, { ...options, store }),
  );
}

/** Solid adapter for NumberField ScrubArea. */
export function ScrubArea(props: ScrubArea.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useNumberFieldStore("ScrubArea");
  const state = createRenderableState(store, store.state);
  const publicState = stateView(state);
  const [local, renderableProps] = splitProps(props, ["children", "ref"]);
  const element = new NumberFieldScrubAreaRenderable(
    renderer,
    untrack(() => ({ ...renderableProps, store })),
  );
  const renderedChildren = createMemo(() => {
    const child = local.children;
    return typeof child === "function"
      ? untrack(() => child(publicState))
      : child;
  });
  const ref = untrack(() => local.ref);
  setRenderableRef(ref, element);
  onCleanup(() => setRenderableRef(ref, undefined));
  spreadRenderableProps(element, () => ({
    ...renderableProps,
    children: renderedChildren(),
  }));
  return element;
}

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
