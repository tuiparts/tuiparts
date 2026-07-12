import {
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { applySlotProps, withStyles } from "../styled-renderable";
import { DEFAULT_BADGE_OPTIONS } from "./constants";
import type { BadgeOptions, BadgeSlotStyles, BadgeState } from "./types";

const DEFAULT_SLOT_STYLES: BadgeSlotStyles = {
  root: {
    backgroundColor: "transparent",
    paddingLeft: 1,
    paddingRight: 1,
  },
  label: {
    color: "#E5E5E5",
  },
};

const EMPTY_STATE: BadgeState = Object.freeze({});

const BadgeBase = withStyles<BadgeState, BadgeSlotStyles>()(BoxRenderable);

/**
 * Composition-pattern Badge. `BadgeRenderable` IS the root Box; the label
 * is a `TextRenderable` child. Slot styles flow into Renderable setters
 * via {@link applySlotProps}; Yoga sizes the Box from the Text child plus
 * any padding declared on the root slot.
 */
export class BadgeRenderable extends BadgeBase {
  protected override _focusable: boolean = false;

  private _label: string;
  private _labelChild: TextRenderable;
  constructor(ctx: RenderContext, options: BadgeOptions = {}) {
    super(ctx, options);

    this._label = options.label ?? DEFAULT_BADGE_OPTIONS.label;
    this._rootStyleBaseline = options;
    this._labelChild = new TextRenderable(ctx, { content: this._label });
    this.add(this._labelChild);

    this._defaultStyles = DEFAULT_SLOT_STYLES;
    this._styles = options.styles;
    this._styleResolver = options.styleResolver;

    this.applyStylesToSlots();
  }

  public getState(): BadgeState {
    return EMPTY_STATE;
  }

  protected applyStylesToSlots(): void {
    const authored = this.getAuthoredStyles();
    const styles = this.mergeStyles(this._defaultStyles, authored);
    applySlotProps(
      this,
      authored.root,
      this._rootStyleBaseline,
      this._defaultStyles?.root,
    );
    applySlotProps(this._labelChild, styles.label);
  }

  protected override onStylesChanged(): void {
    this.applyStylesToSlots();
  }

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    if (this._label === value) return;
    this._label = value;
    this._labelChild.content = value;
  }

  public override destroy(): void {
    for (const child of [...this.getChildren()]) child.destroyRecursively();
    super.destroy();
  }
}
