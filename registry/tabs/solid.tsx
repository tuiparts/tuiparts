/** @jsxImportSource @opentui/solid */

import { Tabs as TabsPrimitive } from "@tuiparts/solid/tabs";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Solid Tabs Root. */
export type TabsProps = TabsPrimitive.Root.Props;
/** Props for the consumer-owned Solid Tabs List. */
export type TabsListProps = TabsPrimitive.List.Props;
/** Props for one labeled consumer-owned Solid Tab. */
export interface TabsTabProps
  extends Omit<TabsPrimitive.Tab.Props, "children"> {
  label: string;
}
/** Props for one consumer-owned Solid Tabs Panel. */
export type TabsPanelProps = TabsPrimitive.Panel.Props;

/** Consumer-owned Solid Tabs Root. */
export function Tabs(props: TabsProps) {
  return <TabsPrimitive.Root gap={1} {...props} />;
}

/** Consumer-owned Solid Tabs List layout. */
export function TabsList(props: TabsListProps) {
  return <TabsPrimitive.List flexDirection="row" gap={1} {...props} />;
}

/** Consumer-owned labeled Solid Tab presentation. */
export function TabsTab(props: TabsTabProps) {
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

/** Consumer-owned Solid Tabs Panel composition seam. */
export function TabsPanel(props: TabsPanelProps) {
  return <TabsPrimitive.Panel {...props} />;
}
