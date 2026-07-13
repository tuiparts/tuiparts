import type { RenderContext } from "@opentui/core";
import { extend } from "@opentui/react";
import { type InputOptions, InputRenderable } from "@opentui-ui/core/input";
import { createElement, type ReactElement, type Ref } from "react";

const INPUT_TAG = "otui-input";

class ReactInputRenderable extends InputRenderable {
  constructor(ctx: RenderContext, options: InputOptions = {}) {
    const {
      onChange: _,
      onInput: __,
      onSubmit: ___,
      ...inputOptions
    } = options;
    super(ctx, inputOptions);
  }
}

extend({ [INPUT_TAG]: ReactInputRenderable });

export type InputProps = InputOptions & {
  ref?: Ref<InputRenderable>;
};

/** React adapter for the OpenTUI-native Input primitive. */
export function Input(props: InputProps): ReactElement {
  return createElement(INPUT_TAG, props);
}

Input.displayName = "Input";
