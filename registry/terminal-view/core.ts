import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface TerminalViewOptions extends BoxOptions {
  title?: string;
  lines?: string[];
  prompt?: string;
  showControls?: boolean;
}

class TerminalViewRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: TerminalViewOptions = {}) {
    const {
      title = "terminal",
      lines = [],
      prompt,
      showControls = true,
      ...boxOptions
    } = options;
    const initialTokens = theme.get();

    super(ctx, {
      borderStyle: initialTokens.borders.style,
      flexDirection: "column",
      ...boxOptions,
    });

    const header = new BoxRenderable(ctx, {
      height: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingX: 1,
    });

    let controls: TextRenderable | undefined;
    if (showControls) {
      controls = new TextRenderable(ctx, { content: "● ● ●" });
      header.add(controls);
    }

    const titleText = new TextRenderable(ctx, { content: title });
    header.add(titleText);

    const spacer = new BoxRenderable(ctx, { width: 5 });
    header.add(spacer);
    this.add(header);

    const body = new BoxRenderable(ctx, {
      flexDirection: "column",
      flexGrow: 1,
      paddingX: 1,
      paddingY: 0,
    });

    for (const line of lines) {
      body.add(new TextRenderable(ctx, { content: line }));
    }

    if (prompt !== undefined) {
      const promptRow = new BoxRenderable(ctx, {
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
      });
      const promptSymbol = new TextRenderable(ctx, { content: prompt });
      const cursor = new TextRenderable(ctx, { content: "█" });
      promptRow.add(promptSymbol);
      promptRow.add(cursor);
      body.add(promptRow);
    }

    this.add(body);

    const applyStyle = (tokens: Readonly<Tokens>) => {
      if (boxOptions.borderColor === undefined) {
        this.borderColor = tokens.colors.border;
      }
      if (boxOptions.backgroundColor === undefined) {
        this.backgroundColor = tokens.colors.background;
      }
      titleText.fg = tokens.colors.foreground;
      if (controls) {
        controls.fg = tokens.colors.mutedForeground;
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

export function createTerminalView(
  ctx: RenderContext,
  options: TerminalViewOptions = {},
): BoxRenderable {
  return new TerminalViewRenderable(ctx, options);
}
