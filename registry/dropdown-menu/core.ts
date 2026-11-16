import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { theme } from "./theme";

export interface DropdownMenuItemOptions {
  label: string;
  shortcut?: string;
  checked?: boolean;
  onSelect?: () => void;
}

export interface DropdownMenuOptions extends BoxOptions {
  triggerLabel?: string;
  open?: boolean;
  textOptions?: TextOptions;
}

export class DropdownMenuRenderable extends BoxRenderable {
  readonly triggerBox: BoxRenderable;
  readonly triggerText: TextRenderable;
  readonly menuBox: BoxRenderable;

  private readonly items: {
    label: string;
    onSelect?: () => void;
    box: BoxRenderable;
    text: TextRenderable;
    shortcutText?: TextRenderable;
  }[] = [];
  private readonly unsubscribeTheme: () => void;
  private _isOpen: boolean;
  private _selectedIndex = 0;

  constructor(ctx: RenderContext, options: DropdownMenuOptions = {}) {
    const {
      triggerLabel = "Menu",
      open = false,
      textOptions,
      ...boxOptions
    } = options;
    const initialTokens = theme.get();

    super(ctx, {
      flexDirection: "column",
      width: 25,
      ...boxOptions,
    });

    this._isOpen = open;

    // Trigger Box
    this.triggerBox = new BoxRenderable(ctx, {
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      paddingX: 1,
      height: 3,
      alignItems: "center",
      justifyContent: "center",
    });

    this.triggerText = new TextRenderable(ctx, {
      content: triggerLabel,
      fg: initialTokens.colors.foreground,
      ...textOptions,
    });
    this.triggerBox.add(this.triggerText);
    this.add(this.triggerBox);

    // Menu Box
    this.menuBox = new BoxRenderable(ctx, {
      flexDirection: "column",
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      paddingX: 1,
      paddingY: 1,
      visible: this._isOpen,
    });
    this.add(this.menuBox);

    this.unsubscribeTheme = theme.subscribe(() => {
      const tokens = theme.get();
      this.triggerBox.borderColor = tokens.colors.border;
      this.triggerBox.backgroundColor = tokens.colors.surface;
      this.triggerText.fg = tokens.colors.foreground;
      this.menuBox.borderColor = tokens.colors.border;
      this.menuBox.backgroundColor = tokens.colors.surface;
      this.updateHighlight();
    });
  }

  get open(): boolean {
    return this._isOpen;
  }

  set open(isOpen: boolean) {
    this._isOpen = isOpen;
    this.menuBox.visible = isOpen;
    this._selectedIndex = 0;
    this.updateHighlight();
  }

  addItem(options: DropdownMenuItemOptions): void {
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
      content: options.label,
      fg: tokens.colors.foreground,
    });
    itemBox.add(itemText);

    let shortcutText: TextRenderable | undefined;
    if (options.shortcut) {
      shortcutText = new TextRenderable(this.ctx, {
        content: options.shortcut,
        fg: tokens.colors.mutedForeground,
      });
      itemBox.add(shortcutText);
    }

    this.menuBox.add(itemBox);

    this.items.push({
      label: options.label,
      onSelect: options.onSelect,
      box: itemBox,
      text: itemText,
      shortcutText,
    });

    this.updateHighlight();
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (key.name === "return") {
      if (!this._isOpen) {
        this.open = true;
        return true;
      }
      const item = this.items[this._selectedIndex];
      if (item) {
        item.onSelect?.();
        this.open = false;
        return true;
      }
    }
    if (this._isOpen) {
      if (key.name === "escape") {
        this.open = false;
        return true;
      }
      if (key.name === "up") {
        if (this.items.length > 0) {
          this._selectedIndex =
            (this._selectedIndex - 1 + this.items.length) % this.items.length;
          this.updateHighlight();
        }
        return true;
      }
      if (key.name === "down") {
        if (this.items.length > 0) {
          this._selectedIndex = (this._selectedIndex + 1) % this.items.length;
          this.updateHighlight();
        }
        return true;
      }
    }
    return super.handleKeyPress?.(key) ?? false;
  }

  private updateHighlight(): void {
    const tokens = theme.get();
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item) continue;
      const isSelected = i === this._selectedIndex && this._isOpen;
      item.box.backgroundColor = isSelected
        ? tokens.colors.primary
        : "transparent";
      item.text.fg = isSelected
        ? tokens.colors.background
        : tokens.colors.foreground;
      if (item.shortcutText) {
        item.shortcutText.fg = isSelected
          ? tokens.colors.background
          : tokens.colors.mutedForeground;
      }
    }
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createDropdownMenu(
  ctx: RenderContext,
  options?: DropdownMenuOptions,
): DropdownMenuRenderable {
  return new DropdownMenuRenderable(ctx, options);
}
