import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { theme } from "./theme";

export type ResizableDirection = "horizontal" | "vertical";

export interface ResizablePanelGroupOptions extends BoxOptions {
  direction?: ResizableDirection;
}

export class ResizablePanelGroupRenderable extends BoxRenderable {
  readonly direction: ResizableDirection;

  constructor(ctx: RenderContext, options: ResizablePanelGroupOptions = {}) {
    const { direction = "horizontal", ...boxOptions } = options;

    super(ctx, {
      width: "100%",
      height: "100%",
      flexDirection: direction === "vertical" ? "column" : "row",
      ...boxOptions,
    });

    this.direction = direction;
  }
}

export interface ResizablePanelOptions extends BoxOptions {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
}

export class ResizablePanelRenderable extends BoxRenderable {
  constructor(ctx: RenderContext, options: ResizablePanelOptions = {}) {
    const {
      defaultSize = 1,
      minSize: _minSize,
      maxSize: _maxSize,
      ...boxOptions
    } = options;

    super(ctx, {
      flexGrow: defaultSize,
      flexShrink: 1,
      flexBasis: 0,
      ...boxOptions,
    });
  }
}

export interface ResizableHandleOptions extends BoxOptions {
  direction?: ResizableDirection;
  withHandle?: boolean;
  textOptions?: TextOptions;
}

export class ResizableHandleRenderable extends BoxRenderable {
  readonly handleText?: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: ResizableHandleOptions = {}) {
    const {
      direction = "horizontal",
      withHandle = false,
      textOptions,
      ...boxOptions
    } = options;
    const initialTokens = theme.get();

    const isHorizontal = direction === "horizontal";

    super(ctx, {
      width: isHorizontal ? 1 : "100%",
      height: isHorizontal ? "100%" : 1,
      backgroundColor: initialTokens.colors.border,
      alignItems: "center",
      justifyContent: "center",
      ...boxOptions,
    });

    if (withHandle) {
      this.handleText = new TextRenderable(ctx, {
        content: isHorizontal ? "⁞" : "···",
        fg: initialTokens.colors.mutedForeground,
        ...textOptions,
      });
      this.add(this.handleText);
    }

    this.unsubscribeTheme = theme.subscribe(() => {
      const tokens = theme.get();
      this.backgroundColor = tokens.colors.border;
      if (this.handleText) {
        this.handleText.fg = tokens.colors.mutedForeground;
      }
    });
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createResizablePanelGroup(
  ctx: RenderContext,
  options?: ResizablePanelGroupOptions,
): ResizablePanelGroupRenderable {
  return new ResizablePanelGroupRenderable(ctx, options);
}

export function createResizablePanel(
  ctx: RenderContext,
  options?: ResizablePanelOptions,
): ResizablePanelRenderable {
  return new ResizablePanelRenderable(ctx, options);
}

export function createResizableHandle(
  ctx: RenderContext,
  options?: ResizableHandleOptions,
): ResizableHandleRenderable {
  return new ResizableHandleRenderable(ctx, options);
}
