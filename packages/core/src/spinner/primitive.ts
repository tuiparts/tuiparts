import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";

export const SPINNER_FRAMES = {
  braille: Object.freeze(["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]),
  dots: Object.freeze(["⠋", "⠙", "⠚", "⠞", "⠖", "⠦", "⠴", "⠲", "⠳", "⠓"]),
  line: Object.freeze(["-", "\\", "|", "/"]),
  arc: Object.freeze(["◜", "◠", "◝", "◞", "◡", "◟"]),
  pulse: Object.freeze(["█", "▓", "▒", "░", "▒", "▓"]),
  arrow: Object.freeze(["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"]),
} as const;

export type SpinnerPreset = keyof typeof SPINNER_FRAMES;

export interface SpinnerFrameChangeDetails {
  readonly frameIndex: number;
  readonly currentFrame: string;
}

export type SpinnerFrameChangeHandler = (
  details: SpinnerFrameChangeDetails,
) => void;

export interface SpinnerState {
  readonly frames: readonly string[];
  readonly interval: number;
  readonly running: boolean;
  readonly frameIndex: number;
  readonly currentFrame: string;
}

export interface SpinnerStoreOptions {
  frames?: readonly string[];
  interval?: number;
  running?: boolean;
  onFrameChange?: SpinnerFrameChangeHandler;
}

type SpinnerStateListener = (state: SpinnerState) => void;

export class SpinnerStore {
  private frames: readonly string[];
  private intervalMs: number;
  private running: boolean;
  private frameIndex: number;
  private onFrameChange?: SpinnerFrameChangeHandler;
  private timer: ReturnType<typeof setInterval> | null = null;
  private snapshot: SpinnerState;
  private readonly listeners = new Set<SpinnerStateListener>();

  constructor(options: SpinnerStoreOptions = {}) {
    this.frames =
      options.frames && options.frames.length > 0
        ? options.frames
        : SPINNER_FRAMES.braille;
    this.intervalMs = Math.max(10, options.interval ?? 80);
    this.running = options.running ?? true;
    this.frameIndex = 0;
    this.onFrameChange = options.onFrameChange;

    this.snapshot = Object.freeze({
      frames: this.frames,
      interval: this.intervalMs,
      running: this.running,
      frameIndex: this.frameIndex,
      currentFrame: this.frames[this.frameIndex] ?? "",
    });

    if (this.running) {
      this.startTimer();
    }
  }

  get state(): SpinnerState {
    return this.snapshot;
  }

  subscribe(listener: SpinnerStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setRunning(running: boolean): void {
    if (this.running === running) return;
    this.running = running;
    if (this.running) {
      this.startTimer();
    } else {
      this.stopTimer();
    }
    this.updateSnapshot();
  }

  setFrames(frames: readonly string[]): void {
    if (!frames || frames.length === 0) return;
    this.frames = frames;
    this.frameIndex = this.frameIndex % this.frames.length;
    this.updateSnapshot();
  }

  setInterval(interval: number): void {
    const nextInterval = Math.max(10, interval);
    if (this.intervalMs === nextInterval) return;
    this.intervalMs = nextInterval;
    if (this.running) {
      this.stopTimer();
      this.startTimer();
    }
    this.updateSnapshot();
  }

  setOnFrameChange(handler: SpinnerFrameChangeHandler | undefined): void {
    this.onFrameChange = handler;
  }

  nextFrame(): void {
    this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    this.onFrameChange?.(
      Object.freeze({
        frameIndex: this.frameIndex,
        currentFrame: this.frames[this.frameIndex] ?? "",
      }),
    );
    this.updateSnapshot();
  }

  reset(): void {
    if (this.frameIndex === 0) return;
    this.frameIndex = 0;
    this.updateSnapshot();
  }

  start(): void {
    this.setRunning(true);
  }

  stop(): void {
    this.setRunning(false);
  }

  destroy(): void {
    this.stopTimer();
    this.running = false;
    this.updateSnapshot();
    this.listeners.clear();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.nextFrame();
    }, this.intervalMs);
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private updateSnapshot(): void {
    this.snapshot = Object.freeze({
      frames: this.frames,
      interval: this.intervalMs,
      running: this.running,
      frameIndex: this.frameIndex,
      currentFrame: this.frames[this.frameIndex] ?? "",
    });
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }
}

export interface SpinnerRootOptions extends BoxOptions {
  store?: SpinnerStore;
  frames?: readonly string[];
  interval?: number;
  running?: boolean;
  onFrameChange?: SpinnerFrameChangeHandler;
}

export class SpinnerRootRenderable extends BoxRenderable {
  private readonly store: SpinnerStore;
  private readonly ownsStore: boolean;

  constructor(ctx: RenderContext, options: SpinnerRootOptions = {}) {
    const { store, frames, interval, running, onFrameChange, ...boxOptions } =
      options;
    super(ctx, {
      flexDirection: "row",
      alignItems: "center",
      ...boxOptions,
    });

    if (store) {
      this.store = store;
      this.ownsStore = false;
      if (frames !== undefined) store.setFrames(frames);
      if (interval !== undefined) store.setInterval(interval);
      if (running !== undefined) store.setRunning(running);
      if (onFrameChange !== undefined) store.setOnFrameChange(onFrameChange);
    } else {
      this.store = new SpinnerStore({
        frames,
        interval,
        running,
        onFrameChange,
      });
      this.ownsStore = true;
    }
  }

  get currentStore(): SpinnerStore {
    return this.store;
  }

  override destroy(): void {
    if (this.ownsStore) {
      this.store.destroy();
    }
    super.destroy();
  }
}

export interface SpinnerIndicatorOptions extends TextOptions {
  store?: SpinnerStore;
}

export class SpinnerIndicatorRenderable extends TextRenderable {
  private readonly store: SpinnerStore;
  private unsubscribe?: () => void;

  constructor(ctx: RenderContext, options: SpinnerIndicatorOptions = {}) {
    const { store, ...textOptions } = options;
    if (!store) {
      throw new Error(
        "SpinnerIndicatorRenderable requires an owning SpinnerStore.",
      );
    }
    super(ctx, {
      content: store.state.currentFrame,
      ...textOptions,
    });
    this.store = store;
    this.unsubscribe = this.store.subscribe((state) => {
      this.content = state.currentFrame;
    });
  }

  get currentFrame(): string {
    return this.store.state.currentFrame;
  }

  override destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    super.destroy();
  }
}

export interface SpinnerLabelOptions extends TextOptions {}

export class SpinnerLabelRenderable extends TextRenderable {
  constructor(ctx: RenderContext, options: SpinnerLabelOptions = {}) {
    super(ctx, options);
  }
}
