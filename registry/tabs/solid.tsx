/** @jsxImportSource @opentui/solid */

import { Tabs as TabsPrimitive } from "@tuiparts/solid/tabs";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Solid Tabs Root. */
export type TabsProps = TabsPrimitive.Root.Props;
/** Props for the consumer-owned Solid Tabs List. */
export type TabsListProps = TabsPrimitive.List.Props;
/** Props for one labeled consumer-owned Solid Tabs Trigger. */
export interface TabsTriggerProps
  extends Omit<TabsPrimitive.Tab.Props, "children"> {
  label: string;
}
/** Props for one consumer-owned Solid Tabs Content region. */
export type TabsContentProps = TabsPrimitive.Panel.Props;

/** Consumer-owned Solid Tabs Root. */
export function Tabs(props: TabsProps) {
  return <TabsPrimitive.Root gap={1} {...props} />;
}

/** Consumer-owned Solid Tabs List layout. */
export function TabsList(props: TabsListProps) {
  return <TabsPrimitive.List flexDirection="row" gap={1} {...props} />;
}

/** Consumer-owned labeled Solid Tabs Trigger presentation. */
export function TabsTrigger(props: TabsTriggerProps) {
  const [recipe, tab] = splitProps(props, ["label"]);
  const tokens = useTheme();
  return (
    <TabsPrimitive.Tab {...tab}>
      {(state: TabsPrimitive.Tab.State) => (
        <box
          backgroundColor={
            state.selected
              ? tokens().colors.primary
              : state.focused
                ? tokens().colors.surface
                : "transparent"
          }
          paddingX={tokens().density.paddingX}
        >
          <text
            content={recipe.label}
            fg={
              state.disabled
                ? tokens().colors.disabledForeground
                : state.selected
                  ? tokens().colors.primaryForeground
                  : tokens().colors.foreground
            }
          />
        </box>
      )}
    </TabsPrimitive.Tab>
  );
}

/** Consumer-owned Solid Tabs Content composition seam. */
export function TabsContent(props: TabsContentProps) {
  return <TabsPrimitive.Panel {...props} />;
}
