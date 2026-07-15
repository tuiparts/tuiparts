/** @jsxImportSource @opentui/solid */

import { Switch as SwitchPrimitive } from "@tuiparts/solid/switch";
import { splitProps } from "solid-js";

export interface SwitchProps
  extends Omit<SwitchPrimitive.Root.Props, "children"> {
  density?: "compact" | "comfortable";
  label: string;
  symbols?: "round" | "ascii";
}

const symbolSets = {
  round: { thumb: "●", track: "─" },
  ascii: { thumb: "*", track: "-" },
} as const;

/** Consumer-owned Solid recipe installed on packaged Switch behavior. */
export function Switch(props: SwitchProps) {
  const [recipe, root] = splitProps(props, [
    "density",
    "disabled",
    "label",
    "symbols",
  ]);
  const trackWidth = () => (recipe.density === "comfortable" ? 5 : 3);
  const glyphs = () => symbolSets[recipe.symbols ?? "round"];

  return (
    <SwitchPrimitive.Root
      flexDirection="row"
      gap={recipe.density === "comfortable" ? 2 : 1}
      backgroundColor="transparent"
      disabled={recipe.disabled}
      {...root}
    >
      {(state: SwitchPrimitive.Root.State) => (
        <>
          <box
            width={trackWidth()}
            height={1}
            position="relative"
            backgroundColor="transparent"
          >
            <text content={glyphs().track.repeat(trackWidth())} fg="#525252" />
            <SwitchPrimitive.Thumb
              width={1}
              height={1}
              position="absolute"
              left={state.checked ? trackWidth() - 1 : 0}
            >
              <text content={glyphs().thumb} fg="#3B82F6" />
            </SwitchPrimitive.Thumb>
          </box>
          <text
            content={recipe.label}
            fg={
              state.disabled ? "#737373" : state.focused ? "#FFFFFF" : "#E5E5E5"
            }
          />
        </>
      )}
    </SwitchPrimitive.Root>
  );
}
