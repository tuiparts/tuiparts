import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import { type InputOptions, InputRenderable } from "@tuiparts/core/input";
import { type Ref, splitProps, untrack } from "solid-js";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";

type InputProps = InputOptions & {
  ref?: Ref<InputRenderable>;
};

/** Solid adapter for the OpenTUI-native Input primitive. */
export function Input(props: Input.Props): JSX.Element {
  const renderer = useRenderer();
  const [local, inputProps] = splitProps(props, [
    "disabled",
    "onChange",
    "onInput",
    "onSubmit",
    "ref",
    "value",
  ]);
  const element = new InputRenderable(
    renderer,
    untrack(() => ({
      ...inputProps,
      disabled: local.disabled,
      value: local.value,
    })),
  );
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({
    ...inputProps,
    disabled: local.disabled,
    onChange: local.onChange,
    onInput: local.onInput,
    onSubmit: local.onSubmit,
    value: local.value,
  }));
  return element;
}

export namespace Input {
  export type Props = InputProps;
}
