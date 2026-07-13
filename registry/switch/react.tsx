/** @jsxImportSource @opentui/react */

import {
  Switch as SwitchPrimitive,
  type SwitchProps as SwitchPrimitiveProps,
} from "@opentui-ui/react/switch";

export interface SwitchProps extends Omit<SwitchPrimitiveProps, "children"> {
  density?: "compact" | "comfortable";
  label: string;
  symbols?: "round" | "ascii";
}

const symbolSets = {
  round: { thumb: "●", track: "─" },
  ascii: { thumb: "*", track: "-" },
} as const;

/** Consumer-owned React recipe installed on packaged Switch behavior. */
export function Switch({
  density = "compact",
  label,
  symbols = "round",
  disabled,
  ...props
}: SwitchProps) {
  const trackWidth = density === "comfortable" ? 5 : 3;
  const glyphs = symbolSets[symbols];

  return (
    <SwitchPrimitive.Root
      flexDirection="row"
      gap={density === "comfortable" ? 2 : 1}
      backgroundColor="transparent"
      disabled={disabled}
      {...props}
    >
      {(state) => (
        <>
          <box
            width={trackWidth}
            height={1}
            position="relative"
            backgroundColor="transparent"
          >
            <text content={glyphs.track.repeat(trackWidth)} fg="#525252" />
            <SwitchPrimitive.Thumb
              width={1}
              height={1}
              position="absolute"
              left={state.checked ? trackWidth - 1 : 0}
            >
              <text content={glyphs.thumb} fg="#3B82F6" />
            </SwitchPrimitive.Thumb>
          </box>
          <text
            content={label}
            fg={
              state.disabled ? "#737373" : state.focused ? "#FFFFFF" : "#E5E5E5"
            }
          />
        </>
      )}
    </SwitchPrimitive.Root>
  );
}
