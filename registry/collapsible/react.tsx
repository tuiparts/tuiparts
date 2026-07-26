/** @jsxImportSource @opentui/react */

import { Collapsible as CollapsiblePrimitive } from "@tuiparts/react/collapsible";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned React Collapsible Root. */
export type CollapsibleProps = CollapsiblePrimitive.Root.Props;

/** Props for the consumer-owned labeled React Collapsible Trigger. */
export interface CollapsibleTriggerProps
  extends Omit<CollapsiblePrimitive.Trigger.Props, "children"> {
  /** Marker shown while closed. */
  closedMark?: string;
  /** Trigger label. */
  label: string;
  /** Marker shown while open. */
  openMark?: string;
}

/** Props for the consumer-owned React Collapsible content region. */
export type CollapsibleContentProps = CollapsiblePrimitive.Panel.Props;

/** Consumer-owned React Collapsible Root layout. */
export function Collapsible(props: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root flexDirection="column" gap={1} {...props} />
  );
}

/** Consumer-owned labeled React Collapsible Trigger presentation. */
export function CollapsibleTrigger({
  closedMark = "›",
  label,
  openMark = "⌄",
  ...props
}: CollapsibleTriggerProps) {
  const tokens = useTheme();
  return (
    <CollapsiblePrimitive.Trigger flexDirection="row" gap={1} {...props}>
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
    </CollapsiblePrimitive.Trigger>
  );
}

/** Consumer-owned React Collapsible content composition seam. */
export function CollapsibleContent(props: CollapsibleContentProps) {
  const tokens = useTheme();
  return (
    <CollapsiblePrimitive.Panel
      paddingLeft={tokens.density.comfortablePaddingX}
      {...props}
    />
  );
}
