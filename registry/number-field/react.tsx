/** @jsxImportSource @opentui/react */

import { NumberField as Primitive } from "@tuiparts/react/number-field";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned React NumberField Recipe. */
export interface NumberFieldProps
  extends Omit<Primitive.Root.Props, "children"> {
  /** Label shown in the draggable ScrubArea. */
  label: string;
  /** Decrement glyph. */
  decrementMark?: string;
  /** Increment glyph. */
  incrementMark?: string;
}

/** Consumer-owned React NumberField composition. */
export function NumberField({
  label,
  decrementMark = "−",
  incrementMark = "+",
  ...props
}: NumberFieldProps) {
  const tokens = useTheme();
  return (
    <Primitive.Root flexDirection="column" gap={1} {...props}>
      {(state) => (
        <>
          <Primitive.ScrubArea>
            <text
              content={label}
              fg={
                state.scrubbing ? tokens.colors.focus : tokens.colors.foreground
              }
            />
          </Primitive.ScrubArea>
          <box flexDirection="row">
            <Primitive.Decrement width={3} justifyContent="center">
              <text content={decrementMark} fg={tokens.colors.foreground} />
            </Primitive.Decrement>
            <Primitive.Input width={8} textColor={tokens.colors.foreground} />
            <Primitive.Increment width={3} justifyContent="center">
              <text content={incrementMark} fg={tokens.colors.foreground} />
            </Primitive.Increment>
          </box>
        </>
      )}
    </Primitive.Root>
  );
}
