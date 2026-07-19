import type { JSX } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
import {
  type TextareaOptions,
  TextareaRenderable,
} from "@tuiparts/core/textarea";
import { type Ref, splitProps, untrack } from "solid-js";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";

/** Props for the Solid Textarea Primitive. */
type TextareaProps = TextareaOptions & {
  /** Ref to the actual Core Textarea Renderable. */
  ref?: Ref<TextareaRenderable>;
};

/** Solid adapter for the OpenTUI-native Textarea Primitive. */
export function Textarea(props: Textarea.Props): JSX.Element {
  const renderer = useRenderer();
  const [local, textareaProps] = splitProps(props, [
    "disabled",
    "initialValue",
    "onContentChange",
    "onCursorChange",
    "onSubmit",
    "ref",
  ]);
  const element = new TextareaRenderable(
    renderer,
    untrack(() => ({
      ...textareaProps,
      disabled: local.disabled,
      initialValue: local.initialValue,
    })),
  );
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({
    ...textareaProps,
    // OpenTUI 0.4.3 setters do not all interpret Solid's removal value as the
    // constructor default. Normalize only those concrete properties here.
    attributes: textareaProps.attributes ?? 0,
    buffered: textareaProps.buffered ?? false,
    cursorColor: textareaProps.cursorColor ?? "#FFFFFF",
    cursorStyle: textareaProps.cursorStyle ?? {
      style: "block" as const,
      blinking: true,
    },
    disabled: local.disabled ?? false,
    flexShrink:
      textareaProps.flexShrink ??
      (typeof textareaProps.width === "number" ||
      typeof textareaProps.height === "number"
        ? 0
        : 1),
    height: textareaProps.height ?? "auto",
    initialValue: local.initialValue,
    keyAliasMap: textareaProps.keyAliasMap ?? {},
    keyBindings: textareaProps.keyBindings ?? [],
    live: textareaProps.live ?? false,
    opacity: textareaProps.opacity ?? 1,
    onContentChange: local.onContentChange,
    onCursorChange: local.onCursorChange,
    onSubmit: local.onSubmit,
    overflow: textareaProps.overflow ?? "visible",
    position: textareaProps.position ?? "relative",
    scrollMargin: textareaProps.scrollMargin ?? 0.2,
    scrollSpeed: textareaProps.scrollSpeed ?? 16,
    selectable: textareaProps.selectable ?? true,
    showCursor: textareaProps.showCursor ?? true,
    syntaxStyle: textareaProps.syntaxStyle ?? null,
    visible: textareaProps.visible ?? true,
    width: textareaProps.width ?? "auto",
    wrapMode: textareaProps.wrapMode ?? "word",
    zIndex: textareaProps.zIndex ?? 0,
  }));
  return element;
}

export namespace Textarea {
  /** Props accepted by the Solid Textarea Primitive. */
  export type Props = TextareaProps;
}
