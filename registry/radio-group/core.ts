import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import {
  RadioGroupIndicatorRenderable,
  RadioGroupItemRenderable,
  RadioGroupRootRenderable,
  type RadioGroupStore,
  type RadioGroupStoreOptions,
} from "@opentui-ui/core/radio";

export interface RadioGroupOptions extends RadioGroupStoreOptions {
  gap?: BoxOptions["gap"];
  orientation?: "horizontal" | "vertical";
}

export interface RadioGroupItemOptions {
  disabled?: boolean;
  label: string;
  mark?: string;
  value: string;
}

/** Consumer-owned imperative recipe using the packaged collection parts. */
export function createRadioGroup(
  ctx: RenderContext,
  options: RadioGroupOptions = {},
): RadioGroupRootRenderable {
  const { gap = 0, orientation = "vertical", ...storeOptions } = options;
  return new RadioGroupRootRenderable(ctx, {
    ...storeOptions,
    backgroundColor: "transparent",
    flexDirection: orientation === "horizontal" ? "row" : "column",
    gap,
  });
}

export function createRadioGroupItem(
  ctx: RenderContext,
  store: RadioGroupStore,
  options: RadioGroupItemOptions,
): RadioGroupItemRenderable {
  const item = new RadioGroupItemRenderable(ctx, {
    store,
    value: options.value,
    disabled: options.disabled,
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: 1,
  });
  const markCell = new BoxRenderable(ctx, { width: 1 });
  const indicator = new RadioGroupIndicatorRenderable(ctx, { item });
  indicator.add(
    new TextRenderable(ctx, {
      content: options.mark ?? "o",
      fg: "#3B82F6",
    }),
  );
  markCell.add(indicator);
  item.add(markCell);
  item.add(
    new TextRenderable(ctx, {
      content: options.label,
      fg: options.disabled ? "#737373" : "#E5E5E5",
    }),
  );
  return item;
}
