import type { RenderContext } from "@opentui/core";
import { extend } from "@opentui/react";
import {
  type InputPrimitiveOptions,
  InputPrimitiveRenderable,
} from "@opentui-ui/core/input";
import { createElement, type ReactElement, type Ref } from "react";

const INPUT_TAG = "otui-input-primitive";

class ReactInputPrimitiveRenderable extends InputPrimitiveRenderable {
  constructor(ctx: RenderContext, options: InputPrimitiveOptions = {}) {
    const {
      onChange: _,
      onInput: __,
      onSubmit: ___,
      ...inputOptions
    } = options;
    super(ctx, inputOptions);
  }
}

extend({ [INPUT_TAG]: ReactInputPrimitiveRenderable });

export type InputPrimitiveProps = InputPrimitiveOptions & {
  ref?: Ref<InputPrimitiveRenderable>;
};

/** React adapter for the OpenTUI-native Input primitive. */
export function InputPrimitive(props: InputPrimitiveProps): ReactElement {
  return createElement(INPUT_TAG, props);
}

InputPrimitive.displayName = "InputPrimitive";
