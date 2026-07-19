/** @jsxImportSource @opentui/react */

import { Tabs as TabsPrimitive } from "@tuiparts/react/tabs";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned React Tabs Root. */
export type TabsProps = TabsPrimitive.Root.Props;
/** Props for the consumer-owned React Tabs List. */
export type TabsListProps = TabsPrimitive.List.Props;
/** Props for one labeled consumer-owned React Tab. */
export interface TabsTabProps
  extends Omit<TabsPrimitive.Tab.Props, "children"> {
  label: string;
}
/** Props for one consumer-owned React Tabs Panel. */
export type TabsPanelProps = TabsPrimitive.Panel.Props;

/** Consumer-owned React Tabs Root. */
export function Tabs(props: TabsProps) {
  return <TabsPrimitive.Root gap={1} {...props} />;
}

/** Consumer-owned React Tabs List layout. */
export function TabsList(props: TabsListProps) {
  return <TabsPrimitive.List flexDirection="row" gap={1} {...props} />;
}

/** Consumer-owned labeled React Tab presentation. */
export function TabsTab({ label, ...props }: TabsTabProps) {
  const tokens = useTheme();
  return (
    <TabsPrimitive.Tab {...props}>
      {(state) => (
        <box
          backgroundColor={
            state.selected
              ? tokens.colors.primary
              : state.focused
                ? tokens.colors.surface
                : "transparent"
          }
          paddingX={tokens.density.paddingX}
        >
          <text
            content={label}
            fg={
              state.disabled
                ? tokens.colors.disabledForeground
                : state.selected
                  ? tokens.colors.primaryForeground
                  : tokens.colors.foreground
            }
          />
        </box>
      )}
    </TabsPrimitive.Tab>
  );
}

/** Consumer-owned React Tabs Panel composition seam. */
export function TabsPanel(props: TabsPanelProps) {
  return <TabsPrimitive.Panel {...props} />;
}
