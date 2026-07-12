import { BoxRenderable, type RenderContext } from "@opentui/core";
import { applySlotProps, withStyles } from "../styled-renderable";
import type {
  RadioGroupOptions,
  RadioGroupSlotStyles,
  RadioGroupState,
} from "./types";

const DEFAULT_SLOT_STYLES: RadioGroupSlotStyles = {
  root: { backgroundColor: "transparent" },
};

const EMPTY_STATE: RadioGroupState = Object.freeze({});
const RadioGroupBase = withStyles<RadioGroupState, RadioGroupSlotStyles>()(
  BoxRenderable,
);

/** Layout-only container. Applications retain ownership of child selection. */
export class RadioGroupRenderable extends RadioGroupBase {
  protected override _focusable: boolean = false;

  constructor(ctx: RenderContext, options: RadioGroupOptions = {}) {
    super(ctx, options);
    this._rootStyleBaseline = options;
    this._defaultStyles = DEFAULT_SLOT_STYLES;
    this._styles = options.styles;
    this._styleResolver = options.styleResolver;
    this.applyStylesToRoot();
  }

  public getState(): RadioGroupState {
    return EMPTY_STATE;
  }

  private applyStylesToRoot(): void {
    const authored = this.getAuthoredStyles();
    applySlotProps(
      this,
      authored.root,
      this._rootStyleBaseline,
      this._defaultStyles?.root,
    );
  }

  protected override onStylesChanged(): void {
    this.applyStylesToRoot();
  }
}
