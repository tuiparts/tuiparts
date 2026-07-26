/** @jsxImportSource @opentui/solid */

import { NumberField as Primitive } from "@tuiparts/solid/number-field";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Solid NumberField Recipe. */
export interface NumberFieldProps
  extends Omit<Primitive.Root.Props, "children"> {
  /** Label shown in the draggable ScrubArea. */
  label: string;
  /** Decrement glyph. */
  decrementMark?: string;
  /** Increment glyph. */
  incrementMark?: string;
}

/** Consumer-owned Solid NumberField composition. */
export function NumberField(props: NumberFieldProps) {
  const [recipe, root] = splitProps(props, [
    "decrementMark",
    "incrementMark",
    "label",
  ]);
  const tokens = useTheme();
  return (
    <Primitive.Root flexDirection="column" gap={1} {...root}>
      {(state: Primitive.Root.State) => (
        <>
          <Primitive.ScrubArea>
            <text
              content={recipe.label}
              fg={
                state.scrubbing
                  ? tokens().colors.focus
                  : tokens().colors.foreground
              }
            />
          </Primitive.ScrubArea>
          <box flexDirection="row">
            <Primitive.Decrement width={3} justifyContent="center">
              <text
                content={recipe.decrementMark ?? "−"}
                fg={tokens().colors.foreground}
              />
            </Primitive.Decrement>
            <Primitive.Input width={8} textColor={tokens().colors.foreground} />
            <Primitive.Increment width={3} justifyContent="center">
              <text
                content={recipe.incrementMark ?? "+"}
                fg={tokens().colors.foreground}
              />
            </Primitive.Increment>
          </box>
        </>
      )}
    </Primitive.Root>
  );
}
