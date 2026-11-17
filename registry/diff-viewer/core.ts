import {
  type BoxOptions,
  BoxRenderable,
  DiffRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface DiffViewerOptions extends BoxOptions {
  diff?: string;
  filetype?: string;
  title?: string;
  view?: "split" | "unified";
}

class DiffViewerRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;
  public readonly diffRenderable: DiffRenderable;

  constructor(ctx: RenderContext, options: DiffViewerOptions = {}) {
    const {
      diff = "",
      filetype,
      title,
      view = "unified",
      ...boxOptions
    } = options;
    const initialTokens = theme.get();

    super(ctx, {
      borderStyle: initialTokens.borders.style,
      flexDirection: "column",
      ...boxOptions,
    });

    let headerTitle: TextRenderable | undefined;
    let headerBadge: TextRenderable | undefined;

    if (title !== undefined) {
      const header = new BoxRenderable(ctx, {
        height: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingX: 1,
      });
      headerTitle = new TextRenderable(ctx, { content: title });
      headerBadge = new TextRenderable(ctx, {
        content: view.toUpperCase(),
      });
      header.add(headerTitle);
      header.add(headerBadge);
      this.add(header);
    }

    this.diffRenderable = new DiffRenderable(ctx, {
      diff,
      filetype,
      view,
      flexGrow: 1,
    });
    this.add(this.diffRenderable);

    const applyStyle = (tokens: Readonly<Tokens>) => {
      if (boxOptions.borderColor === undefined) {
        this.borderColor = tokens.colors.border;
      }
      if (boxOptions.backgroundColor === undefined) {
        this.backgroundColor = tokens.colors.background;
      }
      if (headerTitle) {
        headerTitle.fg = tokens.colors.foreground;
      }
      if (headerBadge) {
        headerBadge.fg = tokens.colors.mutedForeground;
      }
    };
    applyStyle(initialTokens);
    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createDiffViewer(
  ctx: RenderContext,
  options: DiffViewerOptions = {},
): BoxRenderable {
  return new DiffViewerRenderable(ctx, options);
}
