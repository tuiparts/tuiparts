import {
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import {
  CheckboxIndicatorRenderable,
  CheckboxRootRenderable,
  CheckboxStore,
} from "@opentui-ui/core/checkbox";

export interface CheckboxOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label: string;
  mark?: string;
  onCheckedChange?: (checked: boolean) => void;
}

/** Consumer-owned imperative recipe using the same packaged primitive store. */
export function createCheckbox(
  ctx: RenderContext,
  options: CheckboxOptions,
): CheckboxRootRenderable {
  const store = new CheckboxStore(options);
  const root = new CheckboxRootRenderable(ctx, {
    store,
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: 1,
  });
  const markCell = new BoxRenderable(ctx, { width: 1 });
  const indicator = new CheckboxIndicatorRenderable(ctx, { store });
  indicator.add(
    new TextRenderable(ctx, {
      content: options.mark ?? "✓",
      fg: "#3B82F6",
    }),
  );
  markCell.add(indicator);
  root.add(markCell);
  root.add(
    new TextRenderable(ctx, {
      content: options.label,
      fg: options.disabled ? "#737373" : "#E5E5E5",
    }),
  );
  return root;
}
