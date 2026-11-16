import {
  type BoxOptions,
  BoxRenderable,
  MarkdownRenderable,
  type RenderContext,
  SyntaxStyle,
  TextRenderable,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface MarkdownViewerOptions extends BoxOptions {
  content?: string;
  syntaxStyle?: SyntaxStyle;
  title?: string;
}

class MarkdownViewerRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;
  public readonly markdownRenderable: MarkdownRenderable;

  constructor(ctx: RenderContext, options: MarkdownViewerOptions = {}) {
    const { content = "", title, syntaxStyle, ...boxOptions } = options;
    const initialTokens = theme.get();

    super(ctx, {
      borderStyle: initialTokens.borders.style,
      flexDirection: "column",
      ...boxOptions,
    });

    let headerTitle: TextRenderable | undefined;

    if (title !== undefined) {
      const header = new BoxRenderable(ctx, {
        height: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingX: 1,
      });
      headerTitle = new TextRenderable(ctx, { content: title });
      const headerBadge = new TextRenderable(ctx, { content: "MD" });
      header.add(headerTitle);
      header.add(headerBadge);
      this.add(header);
    }

    const resolvedStyle = syntaxStyle ?? SyntaxStyle.create();
    this.markdownRenderable = new MarkdownRenderable(ctx, {
      content,
      syntaxStyle: resolvedStyle,
      flexGrow: 1,
    });
    this.add(this.markdownRenderable);

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
    };
    applyStyle(initialTokens);
    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createMarkdownViewer(
  ctx: RenderContext,
  options: MarkdownViewerOptions = {},
): BoxRenderable {
  return new MarkdownViewerRenderable(ctx, options);
}
