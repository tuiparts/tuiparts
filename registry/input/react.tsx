/** @jsxImportSource @opentui/react */

import {
  Input as BaseInput,
  type InputProps as BaseInputProps,
} from "@opentui-ui/react/input";

export interface InputProps extends BaseInputProps {}

/** Consumer-owned React Input recipe with editable visual defaults. */
export function Input(props: InputProps) {
  return (
    <BaseInput
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
