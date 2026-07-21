/** @jsxImportSource @opentui/react */

import { Tabs as TabsPrimitive } from "@tuiparts/react/tabs";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned React Tabs Root. */
export type TabsProps = TabsPrimitive.Root.Props;
/** Props for the consumer-owned React Tabs List. */
export type TabsListProps = TabsPrimitive.List.Props;
/** Props for one labeled consumer-owned React Tabs Trigger. */
export interface TabsTriggerProps
  extends Omit<TabsPrimitive.Tab.Props, "children"> {
  label: string;
}
/** Props for one consumer-owned React Tabs Content region. */
export type TabsContentProps = TabsPrimitive.Panel.Props;

/** Consumer-owned React Tabs Root. */
export function Tabs({ orientation = "horizontal", ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      flexDirection={orientation === "vertical" ? "row" : "column"}
      gap={1}
      orientation={orientation}
      {...props}
    />
  );
}

/** Consumer-owned React Tabs List layout. */
export function TabsList(props: TabsListProps) {
  const { orientation } = TabsPrimitive.useRootState();
  return (
    <TabsPrimitive.List
      flexDirection={orientation === "vertical" ? "column" : "row"}
      gap={1}
      {...props}
    />
  );
}

/** Consumer-owned labeled React Tabs Trigger presentation. */
export function TabsTrigger({ label, ...props }: TabsTriggerProps) {
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

/** Consumer-owned React Tabs Content composition seam. */
export function TabsContent(props: TabsContentProps) {
  return <TabsPrimitive.Panel {...props} />;
}
