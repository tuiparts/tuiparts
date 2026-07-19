import {
  type KeyEvent,
  type MouseEvent,
  type TextareaOptions as OpenTuiTextareaOptions,
  TextareaRenderable as OpenTuiTextareaRenderable,
  type PasteEvent,
  type RenderContext,
  type RGBA,
  type Selection,
} from "@opentui/core";

/** Options for the OpenTUI-native Textarea Primitive. */
export interface TextareaOptions extends OpenTuiTextareaOptions {
  /** Whether focus, keyboard editing, paste, and submission are disabled. */
  disabled?: boolean;
}

/**
 * Thin multiline Textarea Primitive that preserves OpenTUI's EditBuffer and
 * event model while adding consistent disabled interaction gating.
 */
export class TextareaRenderable extends OpenTuiTextareaRenderable {
  private _disabled: boolean;

  /** Creates a Textarea around OpenTUI's native editing owner. */
  constructor(ctx: RenderContext, options: TextareaOptions = {}) {
    const { disabled = false, ...textareaOptions } = options;
    super(ctx, textareaOptions);
    this._disabled = disabled;
    this._focusable = !disabled;
    this.traits = { ...this.traits, suspend: disabled };
  }

  /** Routes a native key press unless interaction is disabled. */
  override handleKeyPress(key: KeyEvent): boolean {
    if (this._disabled) return false;
    return super.handleKeyPress(key);
  }

  /** Routes native paste bytes unless interaction is disabled. */
  override handlePaste(event: PasteEvent): void {
    if (!this._disabled) super.handlePaste(event);
  }

  /** Gates native wheel scrolling while disabled. */
  protected override onMouseEvent(event: MouseEvent): void {
    if (!this._disabled) super.onMouseEvent(event);
  }

  /** Prevents a disabled editor from becoming the native drag-selection owner. */
  override shouldStartSelection(x: number, y: number): boolean {
    return !this._disabled && super.shouldStartSelection(x, y);
  }

  /** Ignores native drag-selection updates after dynamic disablement. */
  override onSelectionChanged(selection: Selection | null): boolean {
    if (this._disabled) return false;
    return super.onSelectionChanged(selection);
  }

  /** Focuses the native editor unless interaction is disabled. */
  override focus(): void {
    if (!this._disabled) super.focus();
  }

  /** Invokes OpenTUI's native submit callback unless interaction is disabled. */
  override submit(): boolean {
    if (this._disabled) return false;
    return super.submit();
  }

  /**
   * Restores OpenTUI's default bindings when an adapter removes an optional
   * override. OpenTUI's native setter currently requires an array.
   */
  override set keyBindings(bindings: NonNullable<
    OpenTuiTextareaOptions["keyBindings"]
  >,) {
    super.keyBindings = bindings ?? [];
  }

  /**
   * Restores OpenTUI's default aliases when an adapter removes an optional
   * override. OpenTUI's native setter currently requires an object.
   */
  override set keyAliasMap(aliases: NonNullable<
    OpenTuiTextareaOptions["keyAliasMap"]
  >,) {
    super.keyAliasMap = aliases ?? {};
  }

  /** Restores the native cursor-style default after optional prop removal. */
  override get cursorStyle() {
    return super.cursorStyle;
  }

  override set cursorStyle(style: NonNullable<
    OpenTuiTextareaOptions["cursorStyle"]
  >,) {
    super.cursorStyle = style ?? this._defaultOptions.cursorStyle;
  }

  /** Restores editor defaults for scalar props whose native setters reject absence. */
  override set attributes(value: OpenTuiTextareaOptions["attributes"]) {
    super.attributes = value ?? this._defaultOptions.attributes;
  }

  override get attributes(): number {
    return super.attributes;
  }

  override set wrapMode(value: NonNullable<
    OpenTuiTextareaOptions["wrapMode"]
  >,) {
    super.wrapMode = value ?? this._defaultOptions.wrapMode;
  }

  override get wrapMode() {
    return super.wrapMode;
  }

  override set showCursor(value: OpenTuiTextareaOptions["showCursor"]) {
    super.showCursor = value ?? this._defaultOptions.showCursor;
  }

  override get showCursor(): boolean {
    return super.showCursor;
  }

  override set scrollSpeed(value: OpenTuiTextareaOptions["scrollSpeed"]) {
    super.scrollSpeed = value ?? this._defaultOptions.scrollSpeed;
  }

  override get scrollSpeed(): number {
    return super.scrollSpeed;
  }

  /** Adds the reactive setter missing from OpenTUI 0.4.3's option surface. */
  get scrollMargin(): number {
    return this._scrollMargin;
  }

  set scrollMargin(value: OpenTuiTextareaOptions["scrollMargin"]) {
    const nextValue = value ?? this._defaultOptions.scrollMargin;
    if (this._scrollMargin === nextValue) return;
    this._scrollMargin = nextValue;
    this.editorView.setScrollMargin(nextValue);
    this.requestRender();
  }

  /** Clears syntax styling when an adapter removes the optional override. */
  override set syntaxStyle(style: NonNullable<
    OpenTuiTextareaOptions["syntaxStyle"]
  > | null,) {
    super.syntaxStyle = style ?? null;
  }

  override get syntaxStyle() {
    return super.syntaxStyle;
  }

  /** Clears the native tab glyph as well as the public option value. */
  override set tabIndicator(value: OpenTuiTextareaOptions["tabIndicator"]) {
    if (value == null) {
      this._tabIndicator = undefined;
      this.editorView.setTabIndicator(0);
      this.requestRender();
      return;
    }
    super.tabIndicator = value;
  }

  override get tabIndicator() {
    return super.tabIndicator;
  }

  override get tabIndicatorColor(): RGBA | undefined {
    return super.tabIndicatorColor;
  }

  override set tabIndicatorColor(value: RGBA | string | undefined) {
    if (value == null) {
      this._tabIndicatorColor = undefined;
      this.editorView.setTabIndicatorColor(this._defaultOptions.cursorColor);
      this.requestRender();
      return;
    }
    super.tabIndicatorColor = value;
  }

  /** Restores OpenTUI's generated constructor id after adapter removal. */
  override get id(): string {
    return super.id;
  }

  override set id(value: string) {
    super.id = value ?? `renderable-${this.num}`;
  }

  /** Whether user interaction with this Textarea is disabled. */
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(disabled: boolean) {
    const nextDisabled = disabled ?? false;
    if (nextDisabled === this._disabled) return;
    this._disabled = nextDisabled;
    this.traits = { ...this.traits, suspend: nextDisabled };
    if (nextDisabled) {
      if (this._focused) this.blur();

      const rendererSelection = this.isDestroyed
        ? null
        : this._ctx.getSelection();
      if (rendererSelection?.touchedRenderables.includes(this)) {
        // Renderer ownership and the editor's local range are separate. Since
        // disabled onSelectionChanged(null) is intentionally ignored, this
        // cancels the renderer drag without erasing the documented range.
        this._ctx.clearSelection();
      }
    }
    this._focusable = !nextDisabled;
  }
}
