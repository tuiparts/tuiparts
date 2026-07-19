import type { RenderContext } from "@opentui/core";
import { extend } from "@opentui/react";
import {
  type TextareaOptions,
  TextareaRenderable,
} from "@tuiparts/core/textarea";
import { createElement, type ReactElement, type Ref } from "react";

const TEXTAREA_TAG = "tuiparts-textarea";

class ReactTextareaRenderable extends TextareaRenderable {
  constructor(ctx: RenderContext, options: TextareaOptions = {}) {
    /*
     * The reconciler owns framework callback assignment. Omitting callbacks
     * from native construction guarantees one route and supports removal.
     */
    const {
      onContentChange: _,
      onCursorChange: __,
      onSubmit: ___,
      ...textareaOptions
    } = options;
    super(ctx, textareaOptions);
  }
}

extend({ [TEXTAREA_TAG]: ReactTextareaRenderable });

/** Props for the React Textarea Primitive. */
type TextareaProps = TextareaOptions & {
  /** Ref to the actual Core Textarea Renderable. */
  ref?: Ref<TextareaRenderable>;
};

/** React adapter for the OpenTUI-native Textarea Primitive. */
export function Textarea(props: Textarea.Props): ReactElement {
  return createElement(TEXTAREA_TAG, props);
}

Textarea.displayName = "Textarea";

export namespace Textarea {
  /** Props accepted by the React Textarea Primitive. */
  export type Props = TextareaProps;
}
