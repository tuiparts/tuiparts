import type { RenderContext } from "@opentui/core";
import {
  type InputOptions as BaseInputOptions,
  InputRenderable,
} from "@opentui-ui/core/input";

export interface InputOptions extends BaseInputOptions {}

/** Consumer-owned imperative Input recipe with editable visual defaults. */
export function createInput(
  ctx: RenderContext,
  options: InputOptions = {},
): InputRenderable {
  return new InputRenderable(ctx, {
    backgroundColor: "transparent",
    cursorColor: "#E5E5E5",
    focusedBackgroundColor: "transparent",
    focusedTextColor: "#FFFFFF",
    placeholderColor: "#737373",
    textColor: "#E5E5E5",
    ...options,
  });
}
