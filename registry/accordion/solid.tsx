/** @jsxImportSource @opentui/solid */

import { Accordion as AccordionPrimitive } from "@tuiparts/solid/accordion";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Solid Accordion Root. */
export type AccordionProps = AccordionPrimitive.Root.Props;

/** Props for one consumer-owned Solid Accordion Item. */
export type AccordionItemProps = AccordionPrimitive.Item.Props;

/** Props for one consumer-owned labeled Solid Accordion Trigger. */
export interface AccordionTriggerProps
  extends Omit<AccordionPrimitive.Trigger.Props, "children"> {
  /** Marker shown while closed. */
  closedMark?: string;
  /** Trigger label. */
  label: string;
  /** Marker shown while open. */
  openMark?: string;
}

/** Props for one consumer-owned Solid Accordion content region. */
export type AccordionContentProps = AccordionPrimitive.Panel.Props;

/** Consumer-owned Solid Accordion Root layout. */
export function Accordion(props: AccordionProps) {
  return <AccordionPrimitive.Root flexDirection="column" {...props} />;
}

/** Consumer-owned Solid Accordion Item layout. */
export function AccordionItem(props: AccordionItemProps) {
  return <AccordionPrimitive.Item flexDirection="column" gap={1} {...props} />;
}

/** Consumer-owned labeled Solid Accordion Trigger presentation. */
export function AccordionTrigger(props: AccordionTriggerProps) {
  const [recipe, trigger] = splitProps(props, [
    "closedMark",
    "label",
    "openMark",
  ]);
  const tokens = useTheme();
  return (
    <AccordionPrimitive.Trigger flexDirection="row" gap={1} {...trigger}>
      {(state: AccordionPrimitive.Trigger.State) => (
        <>
          <text
            content={
              state.open ? (recipe.openMark ?? "⌄") : (recipe.closedMark ?? "›")
            }
            fg={state.focused ? tokens().colors.focus : tokens().colors.primary}
          />
          <text
            content={recipe.label}
            fg={
              state.disabled
                ? tokens().colors.disabledForeground
                : tokens().colors.foreground
            }
          />
        </>
      )}
    </AccordionPrimitive.Trigger>
  );
}

/** Consumer-owned Solid Accordion content composition seam. */
export function AccordionContent(props: AccordionContentProps) {
  const tokens = useTheme();
  return (
    <AccordionPrimitive.Panel
      paddingLeft={tokens().density.comfortablePaddingX}
      {...props}
    />
  );
}
