import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
} from "@opentui/core";
import { theme } from "./theme";

export interface HoverCardOptions extends BoxOptions {
  open?: boolean;
  openDelay?: number;
  closeDelay?: number;
}

export class HoverCardRenderable extends BoxRenderable {
  readonly triggerBox: BoxRenderable;
  readonly contentBox: BoxRenderable;
  private readonly unsubscribeTheme: () => void;
  private _isOpen: boolean;

  constructor(ctx: RenderContext, options: HoverCardOptions = {}) {
    const {
      open = false,
      openDelay: _openDelay,
      closeDelay: _closeDelay,
      ...boxOptions
    } = options;
    const initialTokens = theme.get();

    super(ctx, {
      flexDirection: "column",
      ...boxOptions,
    });

    this._isOpen = open;

    this.triggerBox = new BoxRenderable(ctx, {
      flexDirection: "row",
    });

    this.contentBox = new BoxRenderable(ctx, {
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      paddingX: 1,
      paddingY: 1,
      visible: this._isOpen,
    });

    this.add(this.triggerBox);
    this.add(this.contentBox);

    this.unsubscribeTheme = theme.subscribe(() => {
      const tokens = theme.get();
      this.contentBox.borderColor = tokens.colors.border;
      this.contentBox.backgroundColor = tokens.colors.surface;
    });
  }

  get open(): boolean {
    return this._isOpen;
  }

  set open(value: boolean) {
    this._isOpen = value;
    this.contentBox.visible = value;
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createHoverCard(
  ctx: RenderContext,
  options?: HoverCardOptions,
): HoverCardRenderable {
  return new HoverCardRenderable(ctx, options);
}
