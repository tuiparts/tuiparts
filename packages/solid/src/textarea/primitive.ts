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
    // OpenTUI's setter rejects the undefined Solid uses for prop removal.
    cursorColor: textareaProps.cursorColor ?? "#FFFFFF",
    disabled: local.disabled,
    initialValue: local.initialValue,
    onContentChange: local.onContentChange,
    onCursorChange: local.onCursorChange,
    onSubmit: local.onSubmit,
  }));
  return element;
}

export namespace Textarea {
  /** Props accepted by the Solid Textarea Primitive. */
  export type Props = TextareaProps;
}
