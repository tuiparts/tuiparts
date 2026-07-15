/** @jsxImportSource @opentui/react */

import { Dialog as DialogPrimitive } from "@opentui-ui/react/dialog";

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
  return (
    <DialogPrimitive.Trigger
      backgroundColor="#262626"
      paddingLeft={1}
      paddingRight={1}
      {...props}
    />
  );
}

/** Responsive Portal, Backdrop, and Popup composition for Dialog content. */
export function DialogContent({
  backdropColor = "#000000",
  children,
  ...props
}: DialogContentProps) {
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
        backgroundColor={backdropColor}
      />
      <DialogPrimitive.Popup
        width="80%"
        maxWidth={56}
        flexDirection="column"
        backgroundColor="#171717"
        border
        borderColor="#737373"
        paddingLeft={1}
        paddingRight={1}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

/** Editable semantic Dialog title. */
export function DialogTitle(props: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title fg="#FFFFFF" {...props} />;
}

/** Editable semantic Dialog description. */
export function DialogDescription(props: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description fg="#A3A3A3" {...props} />;
}

/** Editable Dialog dismissal or action control. */
export function DialogClose(props: DialogPrimitive.Close.Props) {
  return (
    <DialogPrimitive.Close
      backgroundColor="#262626"
      paddingLeft={1}
      paddingRight={1}
      {...props}
    />
  );
}
