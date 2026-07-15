/** @jsxImportSource @opentui/solid */

import { Input as InputPrimitive } from "@tuiparts/solid/input";

export interface InputProps extends InputPrimitive.Props {}

/** Consumer-owned Solid Input recipe with editable visual defaults. */
export function Input(props: InputProps) {
  return (
    <InputPrimitive
      backgroundColor="transparent"
      cursorColor="#E5E5E5"
      focusedBackgroundColor="transparent"
      focusedTextColor="#FFFFFF"
      placeholderColor="#737373"
      textColor="#E5E5E5"
      {...props}
    />
  );
}
