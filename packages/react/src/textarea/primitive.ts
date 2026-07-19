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
  // OpenTUI 0.4.3 setters do not all interpret React's removal value as the
  // constructor default. Normalize only those concrete properties here; the
  // remaining color, callback, event, and Yoga setters already clear safely.
  return createElement(TEXTAREA_TAG, {
    ...props,
    attributes: props.attributes ?? 0,
    buffered: props.buffered ?? false,
    cursorColor: props.cursorColor ?? "#FFFFFF",
    cursorStyle: props.cursorStyle ?? { style: "block", blinking: true },
    disabled: props.disabled ?? false,
    flexShrink:
      props.flexShrink ??
      (typeof props.width === "number" || typeof props.height === "number"
        ? 0
        : 1),
    height: props.height ?? "auto",
    keyAliasMap: props.keyAliasMap ?? {},
    keyBindings: props.keyBindings ?? [],
    live: props.live ?? false,
    opacity: props.opacity ?? 1,
    overflow: props.overflow ?? "visible",
    position: props.position ?? "relative",
    scrollMargin: props.scrollMargin ?? 0.2,
    scrollSpeed: props.scrollSpeed ?? 16,
    selectable: props.selectable ?? true,
    showCursor: props.showCursor ?? true,
    syntaxStyle: props.syntaxStyle ?? null,
    visible: props.visible ?? true,
    width: props.width ?? "auto",
    wrapMode: props.wrapMode ?? "word",
    zIndex: props.zIndex ?? 0,
  });
}

Textarea.displayName = "Textarea";

export namespace Textarea {
  /** Props accepted by the React Textarea Primitive. */
  export type Props = TextareaProps;
}
