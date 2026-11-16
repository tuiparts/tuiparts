import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { theme } from "./theme";

export interface CommandItemRecord {
  value: string;
  label: string;
  onSelect?: () => void;
  box: BoxRenderable;
  text: TextRenderable;
}

export interface CommandOptions extends BoxOptions {
  placeholder?: string;
  textOptions?: TextOptions;
}

export class CommandRenderable extends BoxRenderable {
  readonly inputBox: BoxRenderable;
  readonly inputText: TextRenderable;
  readonly listBox: BoxRenderable;
  readonly emptyBox: BoxRenderable;
  readonly emptyText: TextRenderable;
  private readonly items: CommandItemRecord[] = [];
  private readonly unsubscribeTheme: () => void;
  private _search = "";
  private _selectedIndex = 0;
  private placeholder: string;

  constructor(ctx: RenderContext, options: CommandOptions = {}) {
    const {
      placeholder = "Type a command or search...",
      textOptions,
      ...boxOptions
    } = options;
    const initialTokens = theme.get();

    super(ctx, {
      flexDirection: "column",
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      width: 40,
      height: 12,
      ...boxOptions,
    });

    this.placeholder = placeholder;

    // Search Input Bar
    this.inputBox = new BoxRenderable(ctx, {
      flexDirection: "row",
      paddingX: 1,
      height: 2,
      border: false,
    });
    this.inputText = new TextRenderable(ctx, {
      content: `⌕ ${this.placeholder}`,
      fg: initialTokens.colors.mutedForeground,
      ...textOptions,
    });
    this.inputBox.add(this.inputText);
    this.add(this.inputBox);

    // List container
    this.listBox = new BoxRenderable(ctx, {
      flexDirection: "column",
      flexGrow: 1,
      paddingX: 1,
    });
    this.add(this.listBox);

    // Empty state container
    this.emptyBox = new BoxRenderable(ctx, {
      alignItems: "center",
      justifyContent: "center",
      height: 3,
      visible: false,
    });
    this.emptyText = new TextRenderable(ctx, {
      content: "No results found.",
      fg: initialTokens.colors.mutedForeground,
      ...textOptions,
    });
    this.emptyBox.add(this.emptyText);
    this.listBox.add(this.emptyBox);

    this.unsubscribeTheme = theme.subscribe(() => {
      const tokens = theme.get();
      this.borderColor = tokens.colors.border;
      this.backgroundColor = tokens.colors.surface;
      this.updateInputDisplay();
      this.emptyText.fg = tokens.colors.mutedForeground;
      this.updateHighlight();
    });
  }

  get search(): string {
    return this._search;
  }

  set search(query: string) {
    this._search = query;
    this.updateInputDisplay();
    this.filterItems();
  }

  addItem(value: string, label: string, onSelect?: () => void): void {
    const tokens = theme.get();
    const itemBox = new BoxRenderable(this.ctx, {
      paddingX: 1,
      height: 1,
      backgroundColor: "transparent",
    });
    const itemText = new TextRenderable(this.ctx, {
      content: label,
      fg: tokens.colors.foreground,
    });
    itemBox.add(itemText);
    this.listBox.add(itemBox);

    this.items.push({
      value,
      label,
      onSelect,
      box: itemBox,
      text: itemText,
    });

    this.filterItems();
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (key.name === "up") {
      this.moveSelection(-1);
      return true;
    }
    if (key.name === "down") {
      this.moveSelection(1);
      return true;
    }
    if (key.name === "return") {
      const visible = this.visibleItems();
      const current = visible[this._selectedIndex];
      if (current) {
        current.onSelect?.();
      }
      return true;
    }
    if (key.name === "backspace") {
      if (this._search.length > 0) {
        this.search = this._search.slice(0, -1);
      }
      return true;
    }
    if (key.name === "escape") {
      this.search = "";
      return true;
    }
    if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
      this.search = this._search + key.sequence;
      return true;
    }
    return super.handleKeyPress?.(key) ?? false;
  }

  private visibleItems(): CommandItemRecord[] {
    return this.items.filter((item) => item.box.visible);
  }

  private moveSelection(delta: number): void {
    const visible = this.visibleItems();
    if (visible.length === 0) return;
    this._selectedIndex =
      (this._selectedIndex + delta + visible.length) % visible.length;
    this.updateHighlight();
  }

  private filterItems(): void {
    const q = this._search.toLowerCase();
    let visibleCount = 0;
    for (const item of this.items) {
      const matches = !q || item.label.toLowerCase().includes(q);
      item.box.visible = matches;
      if (matches) visibleCount++;
    }
    this.emptyBox.visible = visibleCount === 0 && this.items.length > 0;
    this._selectedIndex = 0;
    this.updateHighlight();
  }

  private updateHighlight(): void {
    const tokens = theme.get();
    const visible = this.visibleItems();
    for (let i = 0; i < visible.length; i++) {
      const item = visible[i];
      if (!item) continue;
      const isSelected = i === this._selectedIndex;
      item.box.backgroundColor = isSelected
        ? tokens.colors.primary
        : "transparent";
      item.text.fg = isSelected
        ? tokens.colors.background
        : tokens.colors.foreground;
    }
  }

  private updateInputDisplay(): void {
    const tokens = theme.get();
    if (this._search.length === 0) {
      this.inputText.content = `⌕ ${this.placeholder}`;
      this.inputText.fg = tokens.colors.mutedForeground;
    } else {
      this.inputText.content = `⌕ ${this._search}`;
      this.inputText.fg = tokens.colors.foreground;
    }
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createCommand(
  ctx: RenderContext,
  options?: CommandOptions,
): CommandRenderable {
  return new CommandRenderable(ctx, options);
}
