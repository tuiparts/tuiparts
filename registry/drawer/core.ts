import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { theme, tint } from "./theme";

export interface DrawerOptions extends BoxOptions {
  open?: boolean;
  title?: string;
  description?: string;
  textOptions?: TextOptions;
}

export class DrawerRenderable extends BoxRenderable {
  readonly backdropBox: BoxRenderable;
  readonly contentBox: BoxRenderable;
  readonly handleBox: BoxRenderable;
  readonly titleText?: TextRenderable;
  readonly descriptionText?: TextRenderable;
  private readonly unsubscribeTheme: () => void;
  private _isOpen: boolean;

  constructor(ctx: RenderContext, options: DrawerOptions = {}) {
    const {
      open = false,
      title,
      description,
      height = "50%" as const,
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

    this.contentBox = new BoxRenderable(ctx, {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height,
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      flexDirection: "column",
      paddingX: 1,
      paddingY: 1,
    });

    this.handleBox = new BoxRenderable(ctx, {
      width: 8,
      height: 1,
      backgroundColor: initialTokens.colors.mutedForeground,
      alignSelf: "center",
      marginBottom: 1,
    });
    this.contentBox.add(this.handleBox);

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
      this.handleBox.backgroundColor = tokens.colors.mutedForeground;
      if (this.titleText) this.titleText.fg = tokens.colors.foreground;
      if (this.descriptionText) {
        this.descriptionText.fg = tokens.colors.mutedForeground;
      }
    });
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

export function createDrawer(
  ctx: RenderContext,
  options?: DrawerOptions,
): DrawerRenderable {
  return new DrawerRenderable(ctx, options);
}
