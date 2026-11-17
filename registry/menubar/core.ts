import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { theme } from "./theme";

export interface MenubarItemOptions {
  label: string;
  shortcut?: string;
  onSelect?: () => void;
}

export interface MenubarMenuData {
  id: string;
  label: string;
  items: MenubarItemOptions[];
}

export interface MenubarOptions extends BoxOptions {
  menus?: MenubarMenuData[];
  textOptions?: TextOptions;
}

export class MenubarRenderable extends BoxRenderable {
  readonly barBox: BoxRenderable;
  private readonly menus: {
    id: string;
    label: string;
    triggerBox: BoxRenderable;
    triggerText: TextRenderable;
    contentBox: BoxRenderable;
    items: {
      label: string;
      onSelect?: () => void;
      box: BoxRenderable;
      text: TextRenderable;
      shortcutText?: TextRenderable;
    }[];
  }[] = [];
  private readonly unsubscribeTheme: () => void;
  private _activeMenuIndex = 0;
  private _activeItemIndex = 0;
  private _isOpen = false;

  constructor(ctx: RenderContext, options: MenubarOptions = {}) {
    const {
      menus: initialMenus = [],
      textOptions: _textOptions,
      ...boxOptions
    } = options;
    const initialTokens = theme.get();

    super(ctx, {
      flexDirection: "column",
      width: "100%",
      ...boxOptions,
    });

    this.barBox = new BoxRenderable(ctx, {
      flexDirection: "row",
      alignItems: "center",
      border: true,
      borderStyle: "single",
      borderColor: initialTokens.colors.border,
      backgroundColor: initialTokens.colors.surface,
      paddingX: 1,
      height: 3,
    });
    this.add(this.barBox);

    for (const m of initialMenus) {
      this.addMenu(m.id, m.label, m.items);
    }

    this.unsubscribeTheme = theme.subscribe(() => {
      const tokens = theme.get();
      this.barBox.borderColor = tokens.colors.border;
      this.barBox.backgroundColor = tokens.colors.surface;
      for (const m of this.menus) {
        m.contentBox.borderColor = tokens.colors.border;
        m.contentBox.backgroundColor = tokens.colors.surface;
      }
      this.updateHighlight();
    });
  }

  get activeMenuIndex(): number {
    return this._activeMenuIndex;
  }

  set activeMenuIndex(index: number) {
    this._activeMenuIndex = index;
    this.updateHighlight();
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  set isOpen(open: boolean) {
    this._isOpen = open;
    this.updateHighlight();
  }

  addMenu(id: string, label: string, items: MenubarItemOptions[] = []): void {
    const tokens = theme.get();
    const triggerBox = new BoxRenderable(this.ctx, {
      paddingX: 1,
      height: 1,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    });
    const triggerText = new TextRenderable(this.ctx, {
      content: label,
      fg: tokens.colors.foreground,
    });
    triggerBox.add(triggerText);
    this.barBox.add(triggerBox);

    const contentBox = new BoxRenderable(this.ctx, {
      flexDirection: "column",
      border: true,
      borderStyle: "single",
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
      paddingX: 1,
      paddingY: 1,
      width: 25,
      visible: false,
    });
    this.add(contentBox);

    const menuRecord = {
      id,
      label,
      triggerBox,
      triggerText,
      contentBox,
      items: [] as {
        label: string;
        onSelect?: () => void;
        box: BoxRenderable;
        text: TextRenderable;
        shortcutText?: TextRenderable;
      }[],
    };

    for (const item of items) {
      const itemBox = new BoxRenderable(this.ctx, {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 1,
        paddingX: 1,
        backgroundColor: "transparent",
      });
      const itemText = new TextRenderable(this.ctx, {
        content: item.label,
        fg: tokens.colors.foreground,
      });
      itemBox.add(itemText);

      let shortcutText: TextRenderable | undefined;
      if (item.shortcut) {
        shortcutText = new TextRenderable(this.ctx, {
          content: item.shortcut,
          fg: tokens.colors.mutedForeground,
        });
        itemBox.add(shortcutText);
      }
      contentBox.add(itemBox);

      menuRecord.items.push({
        label: item.label,
        onSelect: item.onSelect,
        box: itemBox,
        text: itemText,
        shortcutText,
      });
    }

    this.menus.push(menuRecord);
    this.updateHighlight();
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this.menus.length === 0) return super.handleKeyPress?.(key) ?? false;

    if (!this._isOpen) {
      if (key.name === "left") {
        this._activeMenuIndex =
          (this._activeMenuIndex - 1 + this.menus.length) % this.menus.length;
        this.updateHighlight();
        return true;
      }
      if (key.name === "right") {
        this._activeMenuIndex = (this._activeMenuIndex + 1) % this.menus.length;
        this.updateHighlight();
        return true;
      }
      if (key.name === "down" || key.name === "return") {
        this._isOpen = true;
        this._activeItemIndex = 0;
        this.updateHighlight();
        return true;
      }
    } else {
      const activeMenu = this.menus[this._activeMenuIndex];
      if (key.name === "escape") {
        this._isOpen = false;
        this.updateHighlight();
        return true;
      }
      if (key.name === "left") {
        this._activeMenuIndex =
          (this._activeMenuIndex - 1 + this.menus.length) % this.menus.length;
        this._activeItemIndex = 0;
        this.updateHighlight();
        return true;
      }
      if (key.name === "right") {
        this._activeMenuIndex = (this._activeMenuIndex + 1) % this.menus.length;
        this._activeItemIndex = 0;
        this.updateHighlight();
        return true;
      }
      if (activeMenu && activeMenu.items.length > 0) {
        if (key.name === "up") {
          this._activeItemIndex =
            (this._activeItemIndex - 1 + activeMenu.items.length) %
            activeMenu.items.length;
          this.updateHighlight();
          return true;
        }
        if (key.name === "down") {
          this._activeItemIndex =
            (this._activeItemIndex + 1) % activeMenu.items.length;
          this.updateHighlight();
          return true;
        }
        if (key.name === "return") {
          const item = activeMenu.items[this._activeItemIndex];
          if (item) {
            item.onSelect?.();
            this._isOpen = false;
            this.updateHighlight();
            return true;
          }
        }
      }
    }

    return super.handleKeyPress?.(key) ?? false;
  }

  private updateHighlight(): void {
    const tokens = theme.get();
    for (let i = 0; i < this.menus.length; i++) {
      const menu = this.menus[i];
      if (!menu) continue;
      const isTriggerActive = i === this._activeMenuIndex;
      menu.triggerBox.backgroundColor = isTriggerActive
        ? tokens.colors.primary
        : "transparent";
      menu.triggerText.fg = isTriggerActive
        ? tokens.colors.background
        : tokens.colors.foreground;
      menu.contentBox.visible = isTriggerActive && this._isOpen;

      if (isTriggerActive && this._isOpen) {
        for (let j = 0; j < menu.items.length; j++) {
          const item = menu.items[j];
          if (!item) continue;
          const isItemActive = j === this._activeItemIndex;
          item.box.backgroundColor = isItemActive
            ? tokens.colors.primary
            : "transparent";
          item.text.fg = isItemActive
            ? tokens.colors.background
            : tokens.colors.foreground;
          if (item.shortcutText) {
            item.shortcutText.fg = isItemActive
              ? tokens.colors.background
              : tokens.colors.mutedForeground;
          }
        }
      }
    }
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createMenubar(
  ctx: RenderContext,
  options?: MenubarOptions,
): MenubarRenderable {
  return new MenubarRenderable(ctx, options);
}
