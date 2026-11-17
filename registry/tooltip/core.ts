import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { theme } from "./theme";

export interface TooltipOptions extends BoxOptions {
  content: string;
  side?: "top" | "bottom";
  textOptions?: TextOptions;
}

export class TooltipRenderable extends BoxRenderable {
  private hintBox: BoxRenderable;
  private hintText: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: TooltipOptions) {
    const { content, side = "top", textOptions, ...boxOptions } = options;
    const initialTokens = theme.get();

    super(ctx, {
      flexDirection: "column",
      ...boxOptions,
    });

    this.hintBox = new BoxRenderable(ctx, {
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      paddingX: 1,
      height: 3,
      visible: true,
    });

    this.hintText = new TextRenderable(ctx, {
      content,
      fg: initialTokens.colors.foreground,
      ...textOptions,
    });
    this.hintBox.add(this.hintText);

    this.add(this.hintBox);

    this.unsubscribeTheme = theme.subscribe(() => {
      const tokens = theme.get();
      this.hintBox.borderColor = tokens.colors.border;
      this.hintBox.backgroundColor = tokens.colors.surface;
      this.hintText.fg = tokens.colors.foreground;
    });
  }

  get content(): string {
    return this.hintText.plainText;
  }

  set content(text: string) {
    this.hintText.content = text;
  }

  get open(): boolean {
    return this.hintBox.visible;
  }

  set open(visible: boolean) {
    this.hintBox.visible = visible;
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createTooltip(
  ctx: RenderContext,
  options: TooltipOptions,
): TooltipRenderable {
  return new TooltipRenderable(ctx, options);
}
