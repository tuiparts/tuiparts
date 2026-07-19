/** @jsxImportSource @opentui/solid */

import { Tabs as TabsPrimitive } from "@tuiparts/solid/tabs";
import { type Accessor, createContext, splitProps, useContext } from "solid-js";
import { useTheme } from "./use-theme";

const DEFAULT_TABS_ORIENTATION: TabsPrimitive.Root.Orientation = "horizontal";
const TabsOrientationContext = createContext<
  Accessor<TabsPrimitive.Root.Orientation>
>(() => DEFAULT_TABS_ORIENTATION);

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
  const [recipe, root] = splitProps(props, [
    "orientation",
    "flexDirection",
    "gap",
    "children",
  ]);
  const orientation = () => recipe.orientation ?? "horizontal";
  return (
    <TabsOrientationContext.Provider value={orientation}>
      <TabsPrimitive.Root
        flexDirection={
          recipe.flexDirection ??
          (orientation() === "vertical" ? "row" : "column")
        }
        gap={recipe.gap ?? 1}
        orientation={orientation()}
        {...root}
      >
        {recipe.children}
      </TabsPrimitive.Root>
    </TabsOrientationContext.Provider>
  );
}

/** Consumer-owned Solid Tabs List layout. */
export function TabsList(props: TabsListProps) {
  const orientation = useContext(TabsOrientationContext);
  const [recipe, list] = splitProps(props, ["flexDirection", "gap"]);
  return (
    <TabsPrimitive.List
      flexDirection={
        recipe.flexDirection ??
        (orientation() === "vertical" ? "column" : "row")
      }
      gap={recipe.gap ?? 1}
      {...list}
    />
  );
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
