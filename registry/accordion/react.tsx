/** @jsxImportSource @opentui/react */

import { Accordion as AccordionPrimitive } from "@tuiparts/react/accordion";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned React Accordion Root. */
export type AccordionProps = AccordionPrimitive.Root.Props;

/** Props for one consumer-owned React Accordion Item. */
export type AccordionItemProps = AccordionPrimitive.Item.Props;

/** Props for one consumer-owned labeled React Accordion Trigger. */
export interface AccordionTriggerProps
  extends Omit<AccordionPrimitive.Trigger.Props, "children"> {
  /** Marker shown while closed. */
  closedMark?: string;
  /** Trigger label. */
  label: string;
  /** Marker shown while open. */
  openMark?: string;
}

/** Props for one consumer-owned React Accordion content region. */
export type AccordionContentProps = AccordionPrimitive.Panel.Props;

/** Consumer-owned React Accordion Root layout. */
export function Accordion(props: AccordionProps) {
  return <AccordionPrimitive.Root flexDirection="column" {...props} />;
}

/** Consumer-owned React Accordion Item layout. */
export function AccordionItem(props: AccordionItemProps) {
  return <AccordionPrimitive.Item flexDirection="column" gap={1} {...props} />;
}

/** Consumer-owned labeled React Accordion Trigger presentation. */
export function AccordionTrigger({
  closedMark = "›",
  label,
  openMark = "⌄",
  ...props
}: AccordionTriggerProps) {
  const tokens = useTheme();
  return (
    <AccordionPrimitive.Trigger flexDirection="row" gap={1} {...props}>
      {(state) => (
        <>
          <text
            content={state.open ? openMark : closedMark}
            fg={state.focused ? tokens.colors.focus : tokens.colors.primary}
          />
          <text
            content={label}
            fg={
              state.disabled
                ? tokens.colors.disabledForeground
                : tokens.colors.foreground
            }
          />
        </>
      )}
    </AccordionPrimitive.Trigger>
  );
}

/** Consumer-owned React Accordion content composition seam. */
export function AccordionContent(props: AccordionContentProps) {
  const tokens = useTheme();
  return (
    <AccordionPrimitive.Panel
      paddingLeft={tokens.density.comfortablePaddingX}
      {...props}
    />
  );
}
