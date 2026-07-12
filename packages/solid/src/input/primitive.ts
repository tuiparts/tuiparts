import type { JSX } from "@opentui/solid";
import { spread, useRenderer } from "@opentui/solid";
import {
  type InputPrimitiveOptions,
  InputPrimitiveRenderable,
} from "@opentui-ui/core/input";
import { type Ref, splitProps, untrack } from "solid-js";

export type InputPrimitiveProps = InputPrimitiveOptions & {
  ref?: Ref<InputPrimitiveRenderable>;
};

/** Solid adapter for the OpenTUI-native Input primitive. */
export function InputPrimitive(props: InputPrimitiveProps): JSX.Element {
  const renderer = useRenderer();
  const [local, inputProps] = splitProps(props, [
    "disabled",
    "onChange",
    "onInput",
    "onSubmit",
    "ref",
    "value",
  ]);
  const element = new InputPrimitiveRenderable(
    renderer,
    untrack(() => ({
      ...inputProps,
      disabled: local.disabled,
      value: local.value,
    })),
  );
  if (typeof local.ref === "function") local.ref(element);
  spread(element, () => ({
    ...inputProps,
    disabled: local.disabled,
    onChange: local.onChange,
    onInput: local.onInput,
    onSubmit: local.onSubmit,
    value: local.value,
  }));
  return element;
}
