import {
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import {
  CheckboxIndicatorRenderable,
  CheckboxRootRenderable,
} from "@tuiparts/core/checkbox";

export interface CheckboxOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label: string;
  /** One terminal-cell mark; widen the editable mark cell for wider content. */
  mark?: string;
  onCheckedChange?: (checked: boolean) => void;
}

/** Consumer-owned imperative recipe using packaged Checkbox behavior. */
export function createCheckbox(
  ctx: RenderContext,
  options: CheckboxOptions,
): CheckboxRootRenderable {
  const root = new CheckboxRootRenderable(ctx, {
    backgroundColor: "transparent",
    checked: options.checked,
    defaultChecked: options.defaultChecked,
    disabled: options.disabled,
    flexDirection: "row",
    gap: 1,
    onCheckedChange: options.onCheckedChange,
  });
  const markCell = new BoxRenderable(ctx, { width: 1 });
  const indicator = new CheckboxIndicatorRenderable(ctx, {
    store: root.store,
  });
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
