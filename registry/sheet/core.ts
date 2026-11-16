import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { theme, tint } from "./theme";

export type SheetSide = "top" | "bottom" | "left" | "right";

export interface SheetOptions extends BoxOptions {
  side?: SheetSide;
  open?: boolean;
  title?: string;
  description?: string;
  textOptions?: TextOptions;
}

export class SheetRenderable extends BoxRenderable {
  readonly side: SheetSide;
  readonly backdropBox: BoxRenderable;
  readonly contentBox: BoxRenderable;
  readonly titleText?: TextRenderable;
  readonly descriptionText?: TextRenderable;
  private readonly unsubscribeTheme: () => void;
  private _isOpen: boolean;

  constructor(ctx: RenderContext, options: SheetOptions = {}) {
    const {
      side = "right",
      open = false,
      title,
      description,
      textOptions,
      ...boxOptions
    } = options;
    const initialTokens = theme.get();

    super(ctx, {
      position: "absolute",
      width: "100%",
      height: "100%",
      visible: open,
      ...boxOptions,
    });

    this.side = side;
    this._isOpen = open;

    this.backdropBox = new BoxRenderable(ctx, {
      position: "absolute",
      width: "100%",
      height: "100%",
      backgroundColor: tint(
        initialTokens.colors.background,
        initialTokens.colors.foreground,
        0.25,
      ),
    });
    this.add(this.backdropBox);

    const sideLayoutProps = this.computeSideLayout(side);
    this.contentBox = new BoxRenderable(ctx, {
      position: "absolute",
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      flexDirection: "column",
      paddingX: 1,
      paddingY: 1,
      ...sideLayoutProps,
    });

    if (title) {
      this.titleText = new TextRenderable(ctx, {
        content: title,
        fg: initialTokens.colors.foreground,
        ...textOptions,
      });
      this.contentBox.add(this.titleText);
    }

    if (description) {
      this.descriptionText = new TextRenderable(ctx, {
        content: description,
        fg: initialTokens.colors.mutedForeground,
        ...textOptions,
      });
      this.contentBox.add(this.descriptionText);
    }

    this.add(this.contentBox);

    this.unsubscribeTheme = theme.subscribe(() => {
      const tokens = theme.get();
      this.backdropBox.backgroundColor = tint(
        tokens.colors.background,
        tokens.colors.foreground,
        0.25,
      );
      this.contentBox.borderColor = tokens.colors.border;
      this.contentBox.backgroundColor = tokens.colors.surface;
      if (this.titleText) this.titleText.fg = tokens.colors.foreground;
      if (this.descriptionText) {
        this.descriptionText.fg = tokens.colors.mutedForeground;
      }
    });
  }

  private computeSideLayout(side: SheetSide): Partial<BoxOptions> {
    switch (side) {
      case "right":
        return {
          right: 0,
          top: 0,
          bottom: 0,
          width: "40%",
          maxWidth: 40,
        };
      case "left":
        return {
          left: 0,
          top: 0,
          bottom: 0,
          width: "40%",
          maxWidth: 40,
        };
      case "top":
        return {
          top: 0,
          left: 0,
          right: 0,
          height: "40%",
        };
      case "bottom":
        return {
          bottom: 0,
          left: 0,
          right: 0,
          height: "40%",
        };
    }
  }

  get open(): boolean {
    return this._isOpen;
  }

  set open(value: boolean) {
    this._isOpen = value;
    this.visible = value;
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createSheet(
  ctx: RenderContext,
  options?: SheetOptions,
): SheetRenderable {
  return new SheetRenderable(ctx, options);
}
