/** @jsxImportSource @opentui/solid */

import {
  DialogPrimitive,
  type DialogRootProps,
  type DialogTriggerProps,
} from "@opentui-ui/dialog/solid";
import type { JSX } from "solid-js";
import { splitProps } from "solid-js";

export interface DialogProps extends Omit<DialogRootProps, "children"> {
  children?: JSX.Element;
  closeLabel?: string;
  description?: string;
  title: string;
  trigger: JSX.Element;
}

/** Editable visual composition over the packaged Dialog primitive parts. */
export function Dialog(props: DialogProps) {
  const [recipe, root] = splitProps(props, [
    "children",
    "closeLabel",
    "description",
    "title",
    "trigger",
  ]);
  return (
    <DialogPrimitive.Root {...root}>
      <DialogTrigger>{recipe.trigger}</DialogTrigger>
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
          <DialogPrimitive.Title content={recipe.title} fg="#FFFFFF" />
          {recipe.description ? (
            <DialogPrimitive.Description
              content={recipe.description}
              fg="#A3A3A3"
            />
          ) : null}
          {recipe.children}
          <DialogPrimitive.Close
            backgroundColor="#262626"
            border
            borderColor="#525252"
            paddingLeft={1}
            paddingRight={1}
          >
            <text content={recipe.closeLabel ?? "× Close"} fg="#E5E5E5" />
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
