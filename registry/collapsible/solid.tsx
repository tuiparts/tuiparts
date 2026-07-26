/** @jsxImportSource @opentui/solid */

import { Collapsible as CollapsiblePrimitive } from "@tuiparts/solid/collapsible";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Solid Collapsible Root. */
export type CollapsibleProps = CollapsiblePrimitive.Root.Props;

/** Props for the consumer-owned labeled Solid Collapsible Trigger. */
export interface CollapsibleTriggerProps
  extends Omit<CollapsiblePrimitive.Trigger.Props, "children"> {
  /** Marker shown while closed. */
  closedMark?: string;
  /** Trigger label. */
  label: string;
  /** Marker shown while open. */
  openMark?: string;
}

/** Props for the consumer-owned Solid Collapsible content region. */
export type CollapsibleContentProps = CollapsiblePrimitive.Panel.Props;

/** Consumer-owned Solid Collapsible Root layout. */
export function Collapsible(props: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root flexDirection="column" gap={1} {...props} />
  );
}

/** Consumer-owned labeled Solid Collapsible Trigger presentation. */
export function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  const [recipe, trigger] = splitProps(props, [
    "closedMark",
    "label",
    "openMark",
  ]);
  const tokens = useTheme();
  return (
    <CollapsiblePrimitive.Trigger flexDirection="row" gap={1} {...trigger}>
      {(state: CollapsiblePrimitive.Trigger.State) => (
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
    </CollapsiblePrimitive.Trigger>
  );
}

/** Consumer-owned Solid Collapsible content composition seam. */
export function CollapsibleContent(props: CollapsibleContentProps) {
  const tokens = useTheme();
  return (
    <CollapsiblePrimitive.Panel
      paddingLeft={tokens().density.comfortablePaddingX}
      {...props}
    />
  );
}
