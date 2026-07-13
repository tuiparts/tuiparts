/** @jsxImportSource @opentui/react */

import {
  Dialog as DialogPrimitive,
  type DialogProps as DialogPrimitiveProps,
  type DialogTriggerProps,
} from "@opentui-ui/react/dialog";
import type { ReactNode } from "react";

export interface DialogProps extends Omit<DialogPrimitiveProps, "children"> {
  children?: ReactNode;
  closeLabel?: string;
  description?: string;
  title: string;
  trigger: ReactNode;
}

/** Editable visual composition over the packaged Dialog primitive parts. */
export function Dialog({
  children,
  closeLabel = "× Close",
  description,
  title,
  trigger,
  ...props
}: DialogProps) {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogPrimitive.Portal
        position="absolute"
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
      >
        <DialogPrimitive.Backdrop
          position="absolute"
          width="100%"
          height="100%"
          backgroundColor="#000000"
        />
        <DialogPrimitive.Popup
          width={48}
          flexDirection="column"
          backgroundColor="#171717"
          border
          borderColor="#737373"
          padding={1}
          gap={1}
        >
          <DialogPrimitive.Title content={title} fg="#FFFFFF" />
          {description ? (
            <DialogPrimitive.Description content={description} fg="#A3A3A3" />
          ) : null}
          {children}
          <DialogPrimitive.Close
            backgroundColor="#262626"
            border
            borderColor="#525252"
            paddingLeft={1}
            paddingRight={1}
          >
            <text content={closeLabel} fg="#E5E5E5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** A small, editable trigger presentation for the packaged Trigger part. */
export function DialogTrigger(props: DialogTriggerProps) {
  return (
    <DialogPrimitive.Trigger
      backgroundColor="#262626"
      border
      borderColor="#525252"
      paddingLeft={1}
      paddingRight={1}
      {...props}
    />
  );
}
