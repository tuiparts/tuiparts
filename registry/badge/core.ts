import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";

export type BadgeIntent = "danger" | "neutral" | "success" | "warning";
export type BadgeSize = "compact" | "comfortable";

export interface BadgeOptions extends BoxOptions {
  intent?: BadgeIntent;
  label: string;
  labelOptions?: Omit<TextOptions, "content">;
  size?: BadgeSize;
}

const palettes = {
  danger: { background: "#991B1B", foreground: "#FEF2F2" },
  neutral: { background: "#404040", foreground: "#F5F5F5" },
  success: { background: "#166534", foreground: "#F0FDF4" },
  warning: { background: "#854D0E", foreground: "#FFFBEB" },
} as const;

/** Consumer-owned imperative recipe composed from ordinary OpenTUI Renderables. */
export function createBadge(
  ctx: RenderContext,
  options: BadgeOptions,
): BoxRenderable {
  const {
    intent = "neutral",
    label,
    labelOptions,
    size = "compact",
    ...rootOptions
  } = options;
  const palette = palettes[intent];
  const root = new BoxRenderable(ctx, {
    backgroundColor: palette.background,
    paddingX: size === "comfortable" ? 2 : 1,
    ...rootOptions,
  });
  root.add(
    new TextRenderable(ctx, {
      content: label,
      fg: palette.foreground,
      ...labelOptions,
    }),
  );
  return root;
}
