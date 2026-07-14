import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type Renderable,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";

export type DialogOpenChangeReason =
  | "trigger"
  | "escape"
  | "outside"
  | "close"
  | "action"
  | "programmatic";

export interface DialogOpenChangeDetails {
  readonly open: boolean;
  readonly reason: DialogOpenChangeReason;
  readonly cancelable: boolean;
  preventDefault(): void;
  readonly defaultPrevented: boolean;
}

export interface DialogState {
  readonly open: boolean;
}

export interface DialogStoreOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, details: DialogOpenChangeDetails) => void;
}

type DialogListener = (state: DialogState) => void;

class ChangeDetails implements DialogOpenChangeDetails {
  private prevented = false;

  constructor(
    readonly open: boolean,
    readonly reason: DialogOpenChangeReason,
    readonly cancelable: boolean,
  ) {}

  preventDefault(): void {
    if (this.cancelable) this.prevented = true;
  }

  get defaultPrevented(): boolean {
    return this.prevented;
  }
}

interface DialogLayer {
  readonly store: DialogStore;
  portal?: DialogPortalRenderable;
  popup?: DialogPopupRenderable;
  backdrop?: DialogBackdropRenderable;
  capturedFocus: Renderable | null;
}

/** Coordinates only Dialog layers belonging to one OpenTUI render context. */
class DialogCoordinator {
  /** Durable part registrations, retained while a closed Dialog remains mounted. */
  private readonly registrations = new Map<DialogStore, DialogLayer>();
  /** The ordered subset of registrations which are currently open. */
  private readonly openLayers: DialogLayer[] = [];
  private readonly onKeyPress = (key: KeyEvent) => this.handleKey(key);
  private listening = false;

  constructor(private readonly ctx: RenderContext) {}

  attach(store: DialogStore, portal: DialogPortalRenderable): void {
    const layer = this.layerFor(store);
    layer.portal = portal;
    this.listen();
    this.sync(layer);
    if (store.state.open) this.open(layer);
  }

  detach(store: DialogStore, portal: DialogPortalRenderable): void {
    const layer = this.registrations.get(store);
    if (!layer || layer.portal !== portal) return;
    this.remove(layer, false);
    this.registrations.delete(store);
    this.releaseIfUnused();
  }

  setPopup(store: DialogStore, popup: DialogPopupRenderable | undefined): void {
    const layer = this.layerFor(store);
    layer.popup = popup;
    this.sync(layer);
    if (store.state.open) this.focusInitial(layer);
  }

  setBackdrop(
    store: DialogStore,
    backdrop: DialogBackdropRenderable | undefined,
  ): void {
    const layer = this.layerFor(store);
    layer.backdrop = backdrop;
    this.sync(layer);
  }

  stateChanged(store: DialogStore, wasOpen: boolean): void {
    const layer = this.layerFor(store);
    if (store.state.open && !wasOpen) this.open(layer);
    if (!store.state.open && wasOpen) this.remove(layer, true);
    this.sync(layer);
  }

  dispose(store: DialogStore): void {
    const layer = this.registrations.get(store);
    if (!layer) return;
    this.remove(layer, true);
    this.registrations.delete(store);
    this.releaseIfUnused();
  }

  setRestorationTarget(store: DialogStore, target: Renderable): void {
    this.layerFor(store).capturedFocus = target;
  }

  requestBackdropDismissal(store: DialogStore): boolean {
    if (this.top()?.store !== store) return false;
    return store.requestOpen(false, "outside", true);
  }

  private layerFor(store: DialogStore): DialogLayer {
    let layer = this.registrations.get(store);
    if (!layer) {
      layer = { store, capturedFocus: null };
      this.registrations.set(store, layer);
    }
    return layer;
  }

  private open(layer: DialogLayer): void {
    if (!layer.portal) return;
    layer.capturedFocus ??= this.ctx.currentFocusedRenderable;
    const index = this.openLayers.indexOf(layer);
    if (index !== -1) this.openLayers.splice(index, 1);
    this.openLayers.push(layer);
    this.syncAll();
    this.focusInitial(layer);
  }

  private remove(layer: DialogLayer, restoreFocus: boolean): void {
    const index = this.openLayers.indexOf(layer);
    if (index === -1) return;
    const wasTop = index === this.openLayers.length - 1;
    const target = layer.capturedFocus;
    this.openLayers.splice(index, 1);
    this.syncAll();
    if (restoreFocus && wasTop) {
      // OpenTUI does not blur a focused child merely because it is removed.
      if (this.ctx.currentFocusedRenderable?.focused) {
        this.ctx.blurRenderable(this.ctx.currentFocusedRenderable);
      }
      const parent = this.top();
      if (
        target &&
        this.isAttachedToLayerTree(target, layer) &&
        this.isLiveFocusTarget(target)
      )
        target.focus();
      else if (parent?.popup) this.focusInitial(parent);
    }
    layer.capturedFocus = null;
  }

  private top(): DialogLayer | undefined {
    return this.openLayers.at(-1);
  }

  private handleKey(key: KeyEvent): void {
    const layer = this.top();
    if (!layer?.store.state.open) return;
    if (key.name === "escape") {
      layer.store.requestOpen(false, "escape", true);
      key.preventDefault();
      key.stopPropagation();
      return;
    }
    if (key.name === "tab" && layer.popup) {
      layer.popup.moveFocus(key.shift ? -1 : 1);
      key.preventDefault();
      key.stopPropagation();
    }
  }

  private focusInitial(layer: DialogLayer): void {
    if (this.top() !== layer || !layer.store.state.open) return;
    layer.popup?.focusInitial();
  }

  private syncAll(): void {
    for (const layer of this.registrations.values()) this.sync(layer);
  }

  private sync(layer: DialogLayer): void {
    const index = this.openLayers.indexOf(layer);
    const visible = index !== -1 && layer.store.state.open && !!layer.portal;
    const zIndex = 1000 + Math.max(index, 0) * 10;
    if (layer.portal) {
      layer.portal.visible = visible;
      layer.portal.zIndex = zIndex;
    }
    if (layer.backdrop) {
      layer.backdrop.visible = visible;
      layer.backdrop.zIndex = zIndex + 1;
    }
    if (layer.popup) {
      layer.popup.visible = visible;
      layer.popup.zIndex = zIndex + 2;
    }
  }

  private isAttachedToLayerTree(
    target: Renderable,
    layer: DialogLayer,
  ): boolean {
    if (!target.parent || !layer.portal?.parent) return false;
    const treeRoot = (renderable: Renderable): Renderable => {
      let current = renderable;
      while (current.parent) current = current.parent;
      return current;
    };
    return treeRoot(target) === treeRoot(layer.portal);
  }

  private isLiveFocusTarget(target: Renderable): boolean {
    let current: Renderable | null = target;
    while (current) {
      if (current.isDestroyed || !current.visible) return false;
      current = current.parent;
    }
    return target.focusable;
  }

  private listen(): void {
    if (this.listening) return;
    this.ctx.keyInput.prependListener("keypress", this.onKeyPress);
    this.listening = true;
  }

  private releaseIfUnused(): void {
    if (this.registrations.size > 0) return;
    if (this.listening) this.ctx.keyInput.off("keypress", this.onKeyPress);
    this.listening = false;
    coordinators.delete(this.ctx);
  }
}

const coordinators = new WeakMap<RenderContext, DialogCoordinator>();

function coordinatorFor(ctx: RenderContext): DialogCoordinator {
  let coordinator = coordinators.get(ctx);
  if (!coordinator) {
    coordinator = new DialogCoordinator(ctx);
    coordinators.set(ctx, coordinator);
  }
  return coordinator;
}

/** The small public state interface for one Dialog. It owns no visual tree. */
export class DialogStore {
  private controlled: boolean;
  private currentState: DialogState;
  private onChange?: DialogStoreOptions["onOpenChange"];
  private readonly listeners = new Set<DialogListener>();

  constructor(
    readonly ctx: RenderContext,
    options: DialogStoreOptions = {},
  ) {
    this.controlled = options.open !== undefined;
    this.currentState = Object.freeze({
      open: options.open ?? options.defaultOpen ?? false,
    });
    this.onChange = options.onOpenChange;
  }

  get state(): DialogState {
    return this.currentState;
  }

  subscribe(listener: DialogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  requestOpen(
    open: boolean,
    reason: DialogOpenChangeReason = "programmatic",
    cancelable = false,
  ): boolean {
    if (open === this.currentState.open) return false;
    const details = new ChangeDetails(open, reason, cancelable);
    this.onChange?.(open, details);
    if (details.defaultPrevented) return false;
    if (!this.controlled) this.update(open);
    return true;
  }

  setOpen(open: boolean): boolean {
    return this.requestOpen(open, "programmatic", false);
  }

  setControlledOpen(open: boolean | undefined): void {
    if (typeof open !== "boolean") {
      this.controlled = false;
      return;
    }
    this.controlled = true;
    this.update(open);
  }

  setOnOpenChange(callback: DialogStoreOptions["onOpenChange"]): void {
    this.onChange = callback;
  }

  destroy(): void {
    coordinatorFor(this.ctx).dispose(this);
    this.listeners.clear();
    this.onChange = undefined;
  }

  private update(open: boolean): void {
    if (open === this.currentState.open) return;
    const wasOpen = this.currentState.open;
    this.currentState = Object.freeze({ open });
    coordinatorFor(this.ctx).stateChanged(this, wasOpen);
    for (const listener of this.listeners) listener(this.currentState);
  }
}

export interface DialogRootOptions extends BoxOptions, DialogStoreOptions {
  store?: DialogStore;
}

export class DialogRootRenderable extends BoxRenderable {
  readonly store: DialogStore;
  private readonly unsubscribe: () => void;
  private readonly ownsStore: boolean;

  constructor(ctx: RenderContext, options: DialogRootOptions = {}) {
    const { store, open, defaultOpen, onOpenChange, ...boxOptions } = options;
    super(ctx, boxOptions);
    this.ownsStore = !store;
    this.store =
      store ?? new DialogStore(ctx, { open, defaultOpen, onOpenChange });
    this.unsubscribe = this.store.subscribe(() => this.requestRender());
  }

  get state(): DialogState {
    return this.store.state;
  }

  set open(open: boolean | undefined) {
    this.store.setControlledOpen(open);
  }

  set onOpenChange(callback: DialogStoreOptions["onOpenChange"]) {
    this.store.setOnOpenChange(callback);
  }

  override destroy(): void {
    this.unsubscribe();
    if (this.ownsStore) this.store.destroy();
    super.destroy();
  }
}

interface DialogPartOptions {
  store: DialogStore;
}

export interface DialogTriggerOptions extends BoxOptions, DialogPartOptions {}

export class DialogTriggerRenderable extends BoxRenderable {
  constructor(ctx: RenderContext, options: DialogTriggerOptions) {
    const { store, ...boxOptions } = options;
    super(ctx, {
      ...boxOptions,
      focusable: boxOptions.focusable ?? true,
      onMouseUp: (event) => {
        boxOptions.onMouseUp?.call(this, event);
        this.open();
      },
    });
    this.store = store;
  }

  readonly store: DialogStore;

  press(): boolean {
    return this.open();
  }

  private open(): boolean {
    coordinatorFor(this.ctx).setRestorationTarget(this.store, this);
    const changed = this.store.requestOpen(true, "trigger", true);
    // A canceled or controlled intent has not moved focus into a popup.
    if (!this.store.state.open) this.focus();
    return changed;
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (key.name !== "space" && key.name !== "return" && key.name !== "enter") {
      return false;
    }
    this.press();
    return true;
  }
}

export interface DialogPortalOptions
  extends Omit<BoxOptions, "visible" | "zIndex">,
    DialogPartOptions {}

/** An explicit ownership host. Add Backdrop and Popup to it in any order. */
export class DialogPortalRenderable extends BoxRenderable {
  readonly store: DialogStore;

  constructor(ctx: RenderContext, options: DialogPortalOptions) {
    const { store, ...boxOptions } = options;
    super(ctx, {
      ...boxOptions,
      top: boxOptions.top ?? 0,
      left: boxOptions.left ?? 0,
      position: boxOptions.position ?? "absolute",
      visible: false,
    });
    this.store = store;
    coordinatorFor(ctx).attach(store, this);
  }

  override destroy(): void {
    coordinatorFor(this.ctx).detach(this.store, this);
    super.destroy();
  }
}

export interface DialogBackdropOptions
  extends Omit<BoxOptions, "visible" | "zIndex">,
    DialogPartOptions {}

export class DialogBackdropRenderable extends BoxRenderable {
  readonly store: DialogStore;

  constructor(ctx: RenderContext, options: DialogBackdropOptions) {
    const { store, ...boxOptions } = options;
    super(ctx, {
      ...boxOptions,
      visible: false,
      onMouseUp: (event) => {
        boxOptions.onMouseUp?.call(this, event);
        coordinatorFor(ctx).requestBackdropDismissal(store);
      },
    });
    this.store = store;
    coordinatorFor(ctx).setBackdrop(store, this);
  }

  override destroy(): void {
    coordinatorFor(this.ctx).setBackdrop(this.store, undefined);
    super.destroy();
  }
}

export interface DialogPopupOptions
  extends Omit<BoxOptions, "visible" | "zIndex">,
    DialogPartOptions {
  initialFocus?: Renderable;
}

export class DialogPopupRenderable extends BoxRenderable {
  readonly store: DialogStore;
  private initialTarget?: Renderable;
  private readonly targets = new Set<Renderable>();

  constructor(ctx: RenderContext, options: DialogPopupOptions) {
    const { store, initialFocus, ...boxOptions } = options;
    super(ctx, {
      ...boxOptions,
      focusable: boxOptions.focusable ?? true,
      visible: false,
    });
    this.store = store;
    this.initialTarget = initialFocus;
    coordinatorFor(ctx).setPopup(store, this);
  }

  registerFocusable(target: Renderable, initial = false): () => void {
    this.targets.add(target);
    if (initial) this.initialTarget = target;
    return () => {
      this.targets.delete(target);
      if (this.initialTarget === target) this.initialTarget = undefined;
    };
  }

  focusInitial(): void {
    const target = this.liveTargets()[0] ?? this;
    target.focus();
  }

  moveFocus(direction: 1 | -1): void {
    const targets = this.liveTargets();
    if (targets.length === 0) {
      this.focus();
      return;
    }
    const current = this.ctx.currentFocusedRenderable;
    const index = targets.indexOf(current ?? this);
    if (index === -1) {
      targets[direction === 1 ? 0 : targets.length - 1]?.focus();
      return;
    }
    targets[(index + direction + targets.length) % targets.length]?.focus();
  }

  override destroy(): void {
    coordinatorFor(this.ctx).setPopup(this.store, undefined);
    this.targets.clear();
    super.destroy();
  }

  private liveTargets(): Renderable[] {
    const explicit = [...this.targets].filter((target) =>
      this.isLiveDescendant(target),
    );
    const descendants = this.focusableDescendants(this);
    const initial =
      this.initialTarget && this.isLiveDescendant(this.initialTarget)
        ? this.initialTarget
        : undefined;
    const targets = [...new Set([...descendants, ...explicit])];
    if (initial) {
      const index = targets.indexOf(initial);
      if (index !== -1) targets.splice(index, 1);
      targets.unshift(initial);
    }
    return targets.length > 0 ? targets : [this];
  }

  private isLiveDescendant(target: Renderable): boolean {
    let current: Renderable | null = target;
    while (current && current !== this) {
      if (current.isDestroyed || !current.visible) return false;
      current = current.parent;
    }
    return current === this && target.focusable;
  }

  private focusableDescendants(parent: Renderable): Renderable[] {
    const targets: Renderable[] = [];
    for (const child of parent.getChildren()) {
      if (child.isDestroyed || !child.visible) continue;
      if (child.focusable) targets.push(child);
      targets.push(...this.focusableDescendants(child));
    }
    return targets;
  }
}

export interface DialogCloseOptions extends BoxOptions, DialogPartOptions {
  reason?: "close" | "action";
}

export class DialogCloseRenderable extends BoxRenderable {
  readonly store: DialogStore;
  private closeReason: "close" | "action";

  constructor(ctx: RenderContext, options: DialogCloseOptions) {
    const { store, reason = "close", ...boxOptions } = options;
    super(ctx, {
      ...boxOptions,
      focusable: boxOptions.focusable ?? true,
      onMouseUp: (event) => {
        boxOptions.onMouseUp?.call(this, event);
        store.requestOpen(false, this.closeReason, true);
      },
    });
    this.store = store;
    this.closeReason = reason;
  }

  get reason(): "close" | "action" {
    return this.closeReason;
  }

  set reason(reason: "close" | "action") {
    this.closeReason = reason;
  }

  press(): boolean {
    return this.store.requestOpen(false, this.closeReason, true);
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (key.name !== "space" && key.name !== "return" && key.name !== "enter")
      return false;
    this.press();
    return true;
  }
}

export interface DialogTitleOptions extends TextOptions, DialogPartOptions {}

/** Semantic text part; content and appearance remain entirely caller-owned. */
export class DialogTitleRenderable extends TextRenderable {
  readonly store: DialogStore;

  constructor(ctx: RenderContext, options: DialogTitleOptions) {
    const { store, ...textOptions } = options;
    super(ctx, textOptions);
    this.store = store;
  }
}

export interface DialogDescriptionOptions
  extends TextOptions,
    DialogPartOptions {}

/** Semantic text part; content and appearance remain entirely caller-owned. */
export class DialogDescriptionRenderable extends TextRenderable {
  readonly store: DialogStore;

  constructor(ctx: RenderContext, options: DialogDescriptionOptions) {
    const { store, ...textOptions } = options;
    super(ctx, textOptions);
    this.store = store;
  }
}
