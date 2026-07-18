/** @jsxImportSource @opentui/solid */

import { Dialog as DialogPrimitive } from "@tuiparts/solid/dialog";
import { splitProps } from "solid-js";
import { tint } from "./theme";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Dialog root. */
export interface DialogProps extends DialogPrimitive.Root.Props {}

/** Props for the styled Dialog content composition. */
export interface DialogContentProps extends DialogPrimitive.Popup.Props {
  backdropColor?: DialogPrimitive.Backdrop.Props["backgroundColor"];
}

/** Consumer-owned wrapper over the packaged Dialog root. */
export function Dialog(props: DialogProps) {
  return <DialogPrimitive.Root {...props} />;
}

/** Editable trigger presentation that retains the primitive Trigger ref. */
export function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  const tokens = useTheme();
  return (
    <DialogPrimitive.Trigger
      backgroundColor={tokens().colors.surface}
      paddingLeft={tokens().density.paddingX}
      paddingRight={tokens().density.paddingX}
      {...props}
    />
  );
}

/** Responsive Portal, Backdrop, and Popup composition for Dialog content. */
export function DialogContent(props: DialogContentProps) {
  const [recipe, popup] = splitProps(props, ["backdropColor", "children"]);
  const tokens = useTheme();
  return (
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
        backgroundColor={
          recipe.backdropColor ??
          tint(tokens().colors.background, tokens().colors.foreground, 0.25)
        }
      />
      <DialogPrimitive.Popup
        width="80%"
        maxWidth={56}
        flexDirection="column"
        backgroundColor={tokens().colors.surface}
        border
        borderColor={tokens().colors.border}
        borderStyle={tokens().borders.style}
        paddingLeft={tokens().density.paddingX}
        paddingRight={tokens().density.paddingX}
        {...popup}
      >
        {recipe.children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

/** Editable semantic Dialog title. */
export function DialogTitle(props: DialogPrimitive.Title.Props) {
  const tokens = useTheme();
  return <DialogPrimitive.Title fg={tokens().colors.foreground} {...props} />;
}

/** Editable semantic Dialog description. */
export function DialogDescription(props: DialogPrimitive.Description.Props) {
  const tokens = useTheme();
  return (
    <DialogPrimitive.Description
      fg={tokens().colors.mutedForeground}
      {...props}
    />
  );
}

/** Editable Dialog dismissal or action control. */
export function DialogClose(props: DialogPrimitive.Close.Props) {
  const tokens = useTheme();
  return (
    <DialogPrimitive.Close
      backgroundColor={tokens().colors.surface}
      paddingLeft={tokens().density.paddingX}
      paddingRight={tokens().density.paddingX}
      {...props}
    />
  );
}
