import type { RenderContext } from "@opentui/core";
import { extend } from "@opentui/react";
import { type InputOptions, InputRenderable } from "@tuiparts/core/input";
import { createElement, type ReactElement, type Ref } from "react";

const INPUT_TAG = "otui-input";

class ReactInputRenderable extends InputRenderable {
  constructor(ctx: RenderContext, options: InputOptions = {}) {
    /*
     * The Core constructor and @opentui/react reconciler both register these handlers.
     * Strip them here so the reconciler remains the sole event owner and events fire once.
     */
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

type InputProps = InputOptions & {
  ref?: Ref<InputRenderable>;
};

/** React adapter for the OpenTUI-native Input primitive. */
export function Input(props: Input.Props): ReactElement {
  return createElement(INPUT_TAG, props);
}

Input.displayName = "Input";

export namespace Input {
  export type Props = InputProps;
}
