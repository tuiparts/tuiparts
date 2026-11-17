import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { theme } from "./theme";

export interface SelectItemOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectOptions extends BoxOptions {
  options?: SelectItemOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

export class SelectComponentRenderable extends BoxRenderable {
  private _options: SelectItemOption[];
  private _value?: string;
  private _placeholder: string;
  private _disabled: boolean;
  private _open = false;
  private _highlightedIndex = 0;
  private _onValueChange?: (value: string) => void;
  private readonly unsubscribeTheme: () => void;

  private triggerBox: BoxRenderable;
  private triggerText: TextRenderable;
  private chevronText: TextRenderable;
  private menuBox: BoxRenderable;
  private itemRows: BoxRenderable[] = [];
  private itemTexts: TextRenderable[] = [];

  constructor(ctx: RenderContext, options: SelectOptions = {}) {
    const {
      options: items = [],
      value,
      defaultValue,
      placeholder = "Select...",
      disabled = false,
      onValueChange,
      ...boxOptions
    } = options;

    super(ctx, {
      flexDirection: "column",
      focusable: !disabled,
      ...boxOptions,
    });

    this._options = items;
    this._value = value !== undefined ? value : defaultValue;
    this._placeholder = placeholder;
    this._disabled = disabled;
    this._onValueChange = onValueChange;

    const initialTokens = theme.get();

    this.triggerBox = new BoxRenderable(ctx, {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      paddingX: 1,
      height: 3,
    });

    this.triggerText = new TextRenderable(ctx, {
      content: this.getDisplayLabel(),
      fg: this._value
        ? initialTokens.colors.foreground
        : initialTokens.colors.mutedForeground,
    });
    this.chevronText = new TextRenderable(ctx, {
      content: "▼",
      fg: initialTokens.colors.mutedForeground,
    });

    this.triggerBox.add(this.triggerText);
    this.triggerBox.add(this.chevronText);
    this.add(this.triggerBox);

    this.menuBox = new BoxRenderable(ctx, {
      flexDirection: "column",
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      visible: false,
    });
    this.add(this.menuBox);

    this.rebuildItems();
    this.syncMenu();

    this.unsubscribeTheme = theme.subscribe(() => {
      const tokens = theme.get();
      this.triggerBox.borderColor = this._focused
        ? tokens.colors.primary
        : tokens.colors.border;
      this.triggerText.fg = this._value
        ? tokens.colors.foreground
        : tokens.colors.mutedForeground;
      this.chevronText.fg = tokens.colors.mutedForeground;
      this.menuBox.borderColor = tokens.colors.border;
      this.menuBox.backgroundColor = tokens.colors.surface;
      this.syncMenu();
    });
  }

  private getDisplayLabel(): string {
    if (this._value !== undefined) {
      const found = this._options.find((o) => o.value === this._value);
      if (found) return found.label;
    }
    return this._placeholder;
  }

  private rebuildItems(): void {
    for (const row of this.itemRows) {
      row.destroy();
    }
    this.itemRows = [];
    this.itemTexts = [];

    for (let i = 0; i < this._options.length; i++) {
      const row = new BoxRenderable(this._ctx, {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingX: 1,
        height: 1,
      });

      const label = new TextRenderable(this._ctx, {
        content: "",
      });
      row.add(label);
      this.menuBox.add(row);
      this.itemRows.push(row);
      this.itemTexts.push(label);
    }
  }

  private syncMenu(): void {
    const tokens = theme.get();
    for (let i = 0; i < this._options.length; i++) {
      const item = this._options[i];
      const row = this.itemRows[i];
      const text = this.itemTexts[i];
      if (!item || !row || !text) continue;

      const isSelected = item.value === this._value;
      const isHighlighted = i === this._highlightedIndex;

      row.backgroundColor = isHighlighted
        ? tokens.colors.primary
        : "transparent";
      text.content = `${isSelected ? "✓ " : "  "}${item.label}`;
      text.fg = isHighlighted
        ? tokens.colors.primaryForeground
        : tokens.colors.foreground;
    }
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._disabled) return false;

    if (key.name === "return" || key.name === "enter" || key.name === "space") {
      if (!this._open) {
        this._open = true;
        this.menuBox.visible = true;
        this.chevronText.content = "▲";
        this.syncMenu();
        return true;
      }
      const item = this._options[this._highlightedIndex];
      if (item) {
        this._value = item.value;
        this.triggerText.content = item.label;
        const tokens = theme.get();
        this.triggerText.fg = tokens.colors.foreground;
        this._onValueChange?.(item.value);
      }
      this._open = false;
      this.menuBox.visible = false;
      this.chevronText.content = "▼";
      this.syncMenu();
      return true;
    }

    if (key.name === "escape") {
      if (this._open) {
        this._open = false;
        this.menuBox.visible = false;
        this.chevronText.content = "▼";
        return true;
      }
    }

    if (this._open) {
      if (key.name === "up") {
        if (this._highlightedIndex > 0) {
          this._highlightedIndex--;
          this.syncMenu();
        }
        return true;
      }
      if (key.name === "down") {
        if (this._highlightedIndex < this._options.length - 1) {
          this._highlightedIndex++;
          this.syncMenu();
        }
        return true;
      }
    }

    return super.handleKeyPress?.(key) ?? false;
  }

  override focus(): void {
    if (!this._disabled) {
      super.focus();
      const tokens = theme.get();
      this.triggerBox.borderColor = tokens.colors.primary;
    }
  }

  override blur(): void {
    super.blur();
    const tokens = theme.get();
    this.triggerBox.borderColor = tokens.colors.border;
    if (this._open) {
      this._open = false;
      this.menuBox.visible = false;
      this.chevronText.content = "▼";
    }
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }

  get value(): string | undefined {
    return this._value;
  }

  set value(val: string | undefined) {
    this._value = val;
    this.triggerText.content = this.getDisplayLabel();
    const tokens = theme.get();
    this.triggerText.fg = val
      ? tokens.colors.foreground
      : tokens.colors.mutedForeground;
    this.syncMenu();
  }

  get options(): SelectItemOption[] {
    return this._options;
  }

  set options(opts: SelectItemOption[]) {
    this._options = opts;
    this.triggerText.content = this.getDisplayLabel();
    this.rebuildItems();
    this.syncMenu();
  }
}

export function createSelect(
  ctx: RenderContext,
  options: SelectOptions = {},
): SelectComponentRenderable {
  return new SelectComponentRenderable(ctx, options);
}
