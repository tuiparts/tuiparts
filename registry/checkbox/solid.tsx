/** @jsxImportSource @opentui/solid */

import {
  CheckboxPrimitive,
  type CheckboxPrimitiveRootProps,
  type CheckboxPrimitiveState,
} from "@opentui-ui/solid/checkbox";
import { splitProps } from "solid-js";

export interface CheckboxProps
  extends Omit<CheckboxPrimitiveRootProps, "children"> {
  label: string;
  /** One terminal-cell mark; widen the editable mark cell for wider content. */
  mark?: string;
  tone?: "accent" | "success";
}

/** Consumer-owned recipe installed on top of packaged primitive behavior. */
export function Checkbox(props: CheckboxProps) {
  const [recipe, root] = splitProps(props, [
    "label",
    "mark",
    "tone",
    "disabled",
  ]);
  const markColor = () => (recipe.tone === "success" ? "#10B981" : "#3B82F6");

  return (
    <CheckboxPrimitive.Root
      flexDirection="row"
      gap={1}
      backgroundColor="transparent"
      disabled={recipe.disabled}
      {...root}
    >
      {(state: CheckboxPrimitiveState) => (
        <>
          <box width={1}>
            <CheckboxPrimitive.Indicator>
              <text content={recipe.mark ?? "✓"} fg={markColor()} />
            </CheckboxPrimitive.Indicator>
          </box>
          <text
            content={recipe.label}
            fg={
              state.disabled ? "#737373" : state.focused ? "#FFFFFF" : "#E5E5E5"
            }
          />
        </>
      )}
    </CheckboxPrimitive.Root>
  );
}
