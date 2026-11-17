import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { theme } from "./theme";

export interface ComboboxItemData {
  value: string;
  label: string;
}

export interface ComboboxOptions extends BoxOptions {
  value?: string;
  placeholder?: string;
  options?: ComboboxItemData[];
  open?: boolean;
  textOptions?: TextOptions;
}

export class ComboboxRenderable extends BoxRenderable {
  readonly triggerBox: BoxRenderable;
  readonly triggerText: TextRenderable;
  readonly triggerChevron: TextRenderable;
  readonly popupBox: BoxRenderable;
  readonly searchBox: BoxRenderable;
  readonly searchText: TextRenderable;
  readonly listBox: BoxRenderable;
  readonly emptyBox: BoxRenderable;
  readonly emptyText: TextRenderable;

  private readonly items: {
    value: string;
    label: string;
    box: BoxRenderable;
    text: TextRenderable;
    checkText: TextRenderable;
  }[] = [];
  private readonly unsubscribeTheme: () => void;
  private _value: string;
  private _search = "";
  private _isOpen: boolean;
  private placeholder: string;

  constructor(ctx: RenderContext, options: ComboboxOptions = {}) {
    const {
      value = "",
      placeholder = "Select an option...",
      options: initialOptions = [],
      open = false,
      textOptions,
      ...boxOptions
    } = options;
    const initialTokens = theme.get();

    super(ctx, {
      flexDirection: "column",
      width: 30,
      ...boxOptions,
    });

    this._value = value;
    this._isOpen = open;
    this.placeholder = placeholder;

    // Trigger Box
    this.triggerBox = new BoxRenderable(ctx, {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      paddingX: 1,
      height: 3,
    });

    this.triggerText = new TextRenderable(ctx, {
      content: this.computeTriggerText(),
      fg: this._value
        ? initialTokens.colors.foreground
        : initialTokens.colors.mutedForeground,
      ...textOptions,
    });
    this.triggerChevron = new TextRenderable(ctx, {
      content: this._isOpen ? "▲" : "▼",
      fg: initialTokens.colors.mutedForeground,
      ...textOptions,
    });
    this.triggerBox.add(this.triggerText);
    this.triggerBox.add(this.triggerChevron);
    this.add(this.triggerBox);

    // Popup Box
    this.popupBox = new BoxRenderable(ctx, {
      flexDirection: "column",
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      paddingX: 1,
      paddingY: 1,
      visible: this._isOpen,
    });

    // Search bar
    this.searchBox = new BoxRenderable(ctx, {
      flexDirection: "row",
      height: 1,
      marginBottom: 1,
    });
    this.searchText = new TextRenderable(ctx, {
      content: "⌕ Search...",
      fg: initialTokens.colors.mutedForeground,
      ...textOptions,
    });
    this.searchBox.add(this.searchText);
    this.popupBox.add(this.searchBox);

    // List container
    this.listBox = new BoxRenderable(ctx, {
      flexDirection: "column",
    });
    this.popupBox.add(this.listBox);

    // Empty state container
    this.emptyBox = new BoxRenderable(ctx, {
      alignItems: "center",
      justifyContent: "center",
      height: 2,
      visible: false,
    });
    this.emptyText = new TextRenderable(ctx, {
      content: "No results found.",
      fg: initialTokens.colors.mutedForeground,
      ...textOptions,
    });
    this.emptyBox.add(this.emptyText);
    this.listBox.add(this.emptyBox);

    this.add(this.popupBox);

    for (const opt of initialOptions) {
      this.addItem(opt.value, opt.label);
    }

    this.unsubscribeTheme = theme.subscribe(() => {
      const tokens = theme.get();
      this.triggerBox.borderColor = tokens.colors.border;
      this.triggerBox.backgroundColor = tokens.colors.surface;
      this.popupBox.borderColor = tokens.colors.border;
      this.popupBox.backgroundColor = tokens.colors.surface;
      this.triggerChevron.fg = tokens.colors.mutedForeground;
      this.emptyText.fg = tokens.colors.mutedForeground;
      this.updateDisplay();
    });
  }

  get value(): string {
    return this._value;
  }

  set value(val: string) {
    this._value = val;
    this.updateDisplay();
  }

  get open(): boolean {
    return this._isOpen;
  }

  set open(isOpen: boolean) {
    this._isOpen = isOpen;
    this.popupBox.visible = isOpen;
    this.triggerChevron.content = isOpen ? "▲" : "▼";
  }

  get search(): string {
    return this._search;
  }

  set search(query: string) {
    this._search = query;
    this.filterItems();
  }

  addItem(value: string, label: string): void {
    const tokens = theme.get();
    const itemBox = new BoxRenderable(this.ctx, {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      height: 1,
      paddingX: 1,
      backgroundColor: "transparent",
    });
    const itemText = new TextRenderable(this.ctx, {
      content: label,
      fg: tokens.colors.foreground,
    });
    const checkText = new TextRenderable(this.ctx, {
      content: this._value === value ? "✓" : " ",
      fg: tokens.colors.primary,
    });

    itemBox.add(itemText);
    itemBox.add(checkText);
    this.listBox.add(itemBox);

    this.items.push({
      value,
      label,
      box: itemBox,
      text: itemText,
      checkText,
    });

    this.filterItems();
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (key.name === "return") {
      this.open = !this.open;
      return true;
    }
    if (this._isOpen) {
      if (key.name === "escape") {
        this.open = false;
        return true;
      }
      if (key.name === "backspace") {
        if (this._search.length > 0) {
          this.search = this._search.slice(0, -1);
        }
        return true;
      }
      if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
        this.search = this._search + key.sequence;
        return true;
      }
    }
    return super.handleKeyPress?.(key) ?? false;
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
    this.searchText.content = this._search
      ? `⌕ ${this._search}`
      : "⌕ Search...";
  }

  private computeTriggerText(): string {
    if (!this._value) return this.placeholder;
    const item = this.items.find((i) => i.value === this._value);
    return item ? item.label : this._value;
  }

  private updateDisplay(): void {
    const tokens = theme.get();
    this.triggerText.content = this.computeTriggerText();
    this.triggerText.fg = this._value
      ? tokens.colors.foreground
      : tokens.colors.mutedForeground;

    for (const item of this.items) {
      const isSelected = item.value === this._value;
      item.checkText.content = isSelected ? "✓" : " ";
      item.checkText.fg = tokens.colors.primary;
    }
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createCombobox(
  ctx: RenderContext,
  options?: ComboboxOptions,
): ComboboxRenderable {
  return new ComboboxRenderable(ctx, options);
}
