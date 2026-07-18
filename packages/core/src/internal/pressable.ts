import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type MouseEvent,
  type RenderContext,
} from "@opentui/core";

/** Gesture that produced one semantic press. */
export type PressDetails =
  | Readonly<{ source: "imperative" }>
  | Readonly<{ key: "enter" | "space"; source: "keyboard" }>
  | Readonly<{ button: 0; source: "pointer" }>;

/**
 * Minimal Store shape a Pressable consults. Every foundation Store satisfies
 * it structurally, so Roots attach their Store directly; parts without
 * disabled or focused state simply never attach one and stay permanently
 * enabled. A diverging state shape can attach an inline adapter object.
 */
export interface PressableStore {
  /** Current state snapshot; only `disabled` is consulted. */
  readonly state: { readonly disabled: boolean };
  /** Change notifications driving disabled-blur and focusability sync. */
  subscribe(listener: () => void): () => void;
  /** Mirrors actual Renderable focus into the Store, when tracked. */
  setFocused?(focused: boolean): void;
}

const FROZEN_IMPERATIVE_PRESS: PressDetails = Object.freeze({
  source: "imperative",
});
const FROZEN_POINTER_PRESS: PressDetails = Object.freeze({
  button: 0,
  source: "pointer",
});
const FROZEN_SPACE_PRESS: PressDetails = Object.freeze({
  key: "space",
  source: "keyboard",
});
const FROZEN_ENTER_PRESS: PressDetails = Object.freeze({
  key: "enter",
  source: "keyboard",
});

/**
 * Focusable Root behavior shared by every press-activated primitive.
 *
 * The base owns the interaction contract: the shared activation-key map
 * (uncancelled, unmodified space/enter), the pointer press model (a press
 * starts and ends on the node with the primary button, honoring
 * `defaultPrevented`), disabled-driven focusability and blur, focus mirroring
 * into the Store, and Store teardown. Subclasses define what one semantic
 * press means through {@link handlePress} and may claim additional keys
 * through {@link handleUnclaimedKey}.
 */
export abstract class PressableRenderable extends BoxRenderable {
  private _pressableStore?: PressableStore;
  private _unsubscribePressable?: () => void;
  private _pointerPressed = false;

  constructor(ctx: RenderContext, options: BoxOptions = {}) {
    super(ctx, { ...options, focusable: options.focusable ?? true });
  }

  /** Applies the subclass meaning of one semantic press. */
  protected abstract handlePress(details: PressDetails): void;

  /** Claims keys outside the shared activation map, such as group navigation. */
  protected handleUnclaimedKey(_key: KeyEvent): boolean {
    return false;
  }

  /** Observes pointer-pressed visual state, for Stores that track it. */
  protected onPointerPressedChanged(_pressed: boolean): void {}

  /** Disabled state consulted by every input seam. */
  protected pressableDisabled(): boolean {
    return this._pressableStore?.state.disabled ?? false;
  }

  /** Focusability derived from the current Store state. */
  protected pressableFocusable(): boolean {
    return !this.pressableDisabled();
  }

  /** Adopts the one state Store once the subclass constructs it. */
  protected attachPressable(store: PressableStore): void {
    if (this._pressableStore)
      throw new Error("Pressable store is already attached");
    this._pressableStore = store;
    this._focusable = this.pressableFocusable();
    this._unsubscribePressable = store.subscribe(() => {
      if (this.pressableDisabled() && this._focused) this.blur();
      this._focusable = this.pressableFocusable();
      this.requestRender();
    });
  }

  /** Stops observing the Store; safe to call ahead of subclass teardown. */
  protected detachPressable(): void {
    this._unsubscribePressable?.();
    this._unsubscribePressable = undefined;
  }

  /** Requests one semantic imperative press. */
  press(): void {
    if (this._isDestroyed) return;
    this.handlePress(FROZEN_IMPERATIVE_PRESS);
  }

  protected override onMouseEvent(event: MouseEvent): void {
    super.onMouseEvent(event);
    if (this.pressableDisabled()) {
      event.preventDefault();
      if (this._focused) super.blur();
      return;
    }
    if (event.type === "down") {
      if (event.button !== 0) return;
      this.setPointerPressed(!event.defaultPrevented);
      return;
    }
    if (event.type === "up" && event.button === 0) {
      const shouldPress = this._pointerPressed && !event.defaultPrevented;
      this.setPointerPressed(false);
      if (!shouldPress) return;
      this.focus();
      this.handlePress(FROZEN_POINTER_PRESS);
      return;
    }
    if (event.type === "out" || event.type === "drag-end") {
      this.setPointerPressed(false);
    }
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._isDestroyed || key.defaultPrevented || this.pressableDisabled())
      return false;
    if (
      key.ctrl ||
      key.meta ||
      key.shift ||
      key.option ||
      key.super ||
      key.hyper
    )
      return false;
    if (key.name === "space") {
      this.handlePress(FROZEN_SPACE_PRESS);
      return true;
    }
    if (key.name === "return" || key.name === "enter") {
      this.handlePress(FROZEN_ENTER_PRESS);
      return true;
    }
    return this.handleUnclaimedKey(key);
  }

  override focus(): void {
    if (this.pressableDisabled()) return;
    super.focus();
    this._pressableStore?.setFocused?.(this._focused);
  }

  override blur(): void {
    super.blur();
    this.setPointerPressed(false);
    this._pressableStore?.setFocused?.(false);
  }

  override destroy(): void {
    this.detachPressable();
    super.destroy();
  }

  private setPointerPressed(pressed: boolean): void {
    if (this._pointerPressed === pressed) return;
    this._pointerPressed = pressed;
    this.onPointerPressedChanged(pressed);
  }
}
