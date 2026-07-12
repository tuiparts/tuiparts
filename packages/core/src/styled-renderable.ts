import {
  type BaseRenderable,
  type Renderable,
  type RenderableOptions,
  RGBA,
} from "@opentui/core";

export type StyleState = object;

export type Styles = object;

export type StyleResolver<S extends StyleState, R extends Styles> = (
  state: S,
) => R;

/**
 * Options interface for any `@opentui-ui` component.
 *
 * Generic over the underlying Renderable type (`TBase`) so composition
 * components extending opentui's `BoxRenderable` / `TextRenderable` get
 * correctly typed event-handler `this` parameters. Defaults to
 * `Renderable` for build-from-scratch components that extend the bare
 * `Renderable` directly.
 */
export interface StyledOptions<
  S extends StyleState,
  R extends Styles,
  TBase extends BaseRenderable = Renderable,
> extends RenderableOptions<TBase> {
  /** Static styles applied when no styleResolver is provided. */
  styles?: R;
  /** Dynamic style resolver, invoked with component state. */
  styleResolver?: StyleResolver<S, R>;
}

// =============================================================================
// Slot styling — composition pattern helpers
// =============================================================================

/**
 * Keys excluded from slot-styleable property surfaces. Identity (`id`),
 * component-owned content/interaction, lifecycle, and per-instance event
 * handlers don't belong in declarative slot styles. Everything else on
 * OpenTUI's option types flows through automatically.
 */
type StyleableExclusions =
  | "id"
  | "content"
  | "focusable"
  | "selectable"
  | "enableLayout"
  | "buffered"
  | "live"
  | "renderBefore"
  | "renderAfter"
  | "onMouse"
  | "onMouseDown"
  | "onMouseUp"
  | "onMouseMove"
  | "onMouseDrag"
  | "onMouseDragEnd"
  | "onMouseDrop"
  | "onMouseOver"
  | "onMouseOut"
  | "onMouseScroll"
  | "onPaste"
  | "onKeyDown"
  | "onSizeChange";

/**
 * Subset of an opentui option type usable as a slot-style declaration.
 * Pairs with composition components that push these into native Renderable
 * setters via {@link applySlotProps}.
 *
 * @example
 * ```ts
 * import type { BoxOptions, TextOptions } from "@opentui/core";
 *
 * type BadgeSlotStyleMap = {
 *   root: StyleableSubset<BoxOptions>;
 *   label: TextStyleableSubset<TextOptions>;
 * };
 * ```
 */
export type StyleableSubset<T> = Omit<T, StyleableExclusions>;

/** Normalized public style surface for OpenTUI text-like primitives. */
export type TextStyleableSubset<T extends { fg?: unknown; bg?: unknown }> =
  Omit<StyleableSubset<T>, "fg" | "bg"> & {
    color?: T["fg"];
    backgroundColor?: T["bg"];
  };

/**
 * Push every defined property from a slot-styles object into a target
 * Renderable via its setters. Optional baseline and default layers are applied
 * below authored `props`; passing either layer again replaces its previous
 * values. Properties omitted by every layer are restored to the native value
 * observed before that property was first applied.
 *
 * Public color names are translated at this boundary according to target
 * capabilities: `color` becomes `fg` or `textColor`, `backgroundColor`
 * becomes `bg` for text primitives, and normalized selection colors become
 * `selectionFg` / `selectionBg` for input primitives.
 *
 * Type-untyped at the boundary on purpose. The caller's slot-style type
 * (e.g. `StyleableSubset<BoxOptions>`) already pins which keys are valid
 * to push; here we only care that each key resolves to a setter on
 * `target`. Trying to use `Partial<T>` where `T` is a Renderable subclass
 * type-mismatches because Renderable *instance* fields are typed
 * differently from their *setter inputs* (e.g. `TextRenderable.content`
 * is `StyledText | undefined` as a field but `string | StyledText |
 * undefined` as a setter input).
 *
 */
interface AppliedProperty {
  initialized: boolean;
  observable: boolean;
  requestedSnapshot: unknown;
  targetSnapshot: unknown;
}

interface AppliedTarget {
  baselines?: Map<string, unknown>;
  defaults?: Map<string, unknown>;
  nativeBaselines: Map<string, unknown>;
  properties: Map<string, AppliedProperty>;
}

const appliedSlotProps = new WeakMap<object, AppliedTarget>();

function replaceAppliedLayer(
  current: Map<string, unknown> | undefined,
  source: Record<string, unknown>,
): Map<string, unknown> {
  const layer = current ?? new Map<string, unknown>();
  layer.clear();
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) layer.set(key, assignmentSlotValue(value));
  }
  return layer;
}

const SLOT_PROP_DEFAULTS: Record<string, unknown> = {
  alignItems: "stretch",
  alignSelf: "auto",
  columnGap: 0,
  flexBasis: "auto",
  flexDirection: "column",
  flexGrow: 0,
  flexShrink: 1,
  flexWrap: "no-wrap",
  gap: 0,
  height: "auto",
  justifyContent: "flex-start",
  margin: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  marginX: 0,
  marginY: 0,
  maxHeight: undefined,
  maxWidth: undefined,
  minHeight: undefined,
  minWidth: undefined,
  opacity: 1,
  overflow: "visible",
  padding: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingX: 0,
  paddingY: 0,
  position: "relative",
  rowGap: 0,
  visible: true,
  width: "auto",
  zIndex: 0,
};

interface LayoutNodeResetTarget {
  getLayoutNode?: () => {
    setMaxHeight(value: undefined): void;
    setMaxWidth(value: undefined): void;
    setMinHeight(value: undefined): void;
    setMinWidth(value: undefined): void;
    setPosition(edge: number, value: undefined): void;
  };
  requestRender?: () => void;
}

function resetSlotProp(
  target: Record<string, unknown>,
  key: string,
  baseline: unknown,
): void {
  target[key] = assignmentSlotValue(baseline);
  if (baseline !== undefined) return;

  const layoutTarget = target as LayoutNodeResetTarget;
  const node = layoutTarget.getLayoutNode?.();
  if (!node) return;
  if (key === "minWidth") node.setMinWidth(undefined);
  else if (key === "maxWidth") node.setMaxWidth(undefined);
  else if (key === "minHeight") node.setMinHeight(undefined);
  else if (key === "maxHeight") node.setMaxHeight(undefined);
  else {
    const edge = { left: 0, top: 1, right: 2, bottom: 3 }[key];
    if (edge === undefined) return;
    node.setPosition(edge, undefined);
  }
  layoutTarget.requestRender?.();
}

function snapshotSlotValue(value: unknown): unknown {
  return value instanceof RGBA ? value.buffer.join(",") : value;
}

function assignmentSlotValue(value: unknown): unknown {
  return value instanceof RGBA ? RGBA.clone(value) : value;
}

function isCacheableSlotValue(value: unknown): boolean {
  return value === null || typeof value !== "object" || value instanceof RGBA;
}

function isObservableSlotProperty(target: object, key: string): boolean {
  let current: object | null = target;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) {
      return "value" in descriptor || typeof descriptor.get === "function";
    }
    current = Object.getPrototypeOf(current) as object | null;
  }
  return false;
}

function normalizeSlotProps(
  target: Record<string, unknown>,
  props: object | undefined,
): Record<string, unknown> {
  const source = (props ?? {}) as Record<string, unknown>;
  const normalized = { ...source };

  if (source.color !== undefined) {
    if ("fg" in target) {
      normalized.fg = source.color;
      delete normalized.color;
    } else if ("textColor" in target) {
      normalized.textColor = source.color;
      delete normalized.color;
    }
  }
  if (
    source.backgroundColor !== undefined &&
    "bg" in target &&
    !("backgroundColor" in target)
  ) {
    normalized.bg = source.backgroundColor;
    delete normalized.backgroundColor;
  }
  if (source.selectionColor !== undefined && "selectionFg" in target) {
    normalized.selectionFg = source.selectionColor;
    delete normalized.selectionColor;
  }
  if (
    source.selectionBackgroundColor !== undefined &&
    "selectionBg" in target
  ) {
    normalized.selectionBg = source.selectionBackgroundColor;
    delete normalized.selectionBackgroundColor;
  }

  const padding = normalized.padding;
  if (padding !== undefined) {
    normalized.paddingTop = padding;
    normalized.paddingRight = padding;
    normalized.paddingBottom = padding;
    normalized.paddingLeft = padding;
  }
  const paddingX = normalized.paddingX;
  if (paddingX !== undefined) {
    normalized.paddingRight = paddingX;
    normalized.paddingLeft = paddingX;
  }
  const paddingY = normalized.paddingY;
  if (paddingY !== undefined) {
    normalized.paddingTop = paddingY;
    normalized.paddingBottom = paddingY;
  }
  for (const edge of ["Top", "Right", "Bottom", "Left"] as const) {
    const key = `padding${edge}`;
    if (source[key] !== undefined) normalized[key] = source[key];
  }

  const margin = normalized.margin;
  if (margin !== undefined) {
    normalized.marginTop = margin;
    normalized.marginRight = margin;
    normalized.marginBottom = margin;
    normalized.marginLeft = margin;
  }
  const marginX = normalized.marginX;
  if (marginX !== undefined) {
    normalized.marginRight = marginX;
    normalized.marginLeft = marginX;
  }
  const marginY = normalized.marginY;
  if (marginY !== undefined) {
    normalized.marginTop = marginY;
    normalized.marginBottom = marginY;
  }
  for (const edge of ["Top", "Right", "Bottom", "Left"] as const) {
    const key = `margin${edge}`;
    if (source[key] !== undefined) normalized[key] = source[key];
  }

  const gap = normalized.gap;
  if (gap !== undefined) {
    normalized.rowGap = gap;
    normalized.columnGap = gap;
  }
  if (source.rowGap !== undefined) normalized.rowGap = source.rowGap;
  if (source.columnGap !== undefined) normalized.columnGap = source.columnGap;

  delete normalized.padding;
  delete normalized.paddingX;
  delete normalized.paddingY;
  delete normalized.margin;
  delete normalized.marginX;
  delete normalized.marginY;
  delete normalized.gap;
  return normalized;
}

export function applySlotProps(
  target: object,
  props: object | undefined,
  baseline?: object,
  defaults?: object,
): void {
  const targetRecord = target as Record<string, unknown>;
  const authored = normalizeSlotProps(targetRecord, props);
  let applied = appliedSlotProps.get(target);
  const usesLayers =
    baseline !== undefined ||
    defaults !== undefined ||
    applied?.baselines !== undefined ||
    applied?.defaults !== undefined;
  let next: Map<string, unknown>;

  if (usesLayers) {
    if (!applied) {
      applied = {
        nativeBaselines: new Map(),
        properties: new Map(),
      };
      appliedSlotProps.set(target, applied);
    }
    if (baseline !== undefined) {
      applied.baselines = replaceAppliedLayer(
        applied.baselines,
        normalizeSlotProps(targetRecord, baseline),
      );
    }
    if (defaults !== undefined) {
      applied.defaults = replaceAppliedLayer(
        applied.defaults,
        normalizeSlotProps(targetRecord, defaults),
      );
    }

    next = new Map<string, unknown>(applied.defaults);
    for (const [key, value] of applied.baselines ?? []) {
      if (
        next.has(key) ||
        authored[key] !== undefined ||
        applied.properties.has(key)
      ) {
        next.set(key, value);
      }
    }
  } else {
    next = new Map<string, unknown>();
  }

  for (const [key, value] of Object.entries(authored)) {
    if (value !== undefined) next.set(key, value);
  }

  if (!applied) {
    if (next.size === 0) return;
    applied = {
      nativeBaselines: new Map(),
      properties: new Map(),
    };
    appliedSlotProps.set(target, applied);
  }

  for (const [key] of applied.properties) {
    if (!next.has(key)) {
      resetSlotProp(targetRecord, key, applied.nativeBaselines.get(key));
      applied.properties.delete(key);
    }
  }
  for (const [key, value] of next) {
    if (!applied.nativeBaselines.has(key)) {
      const baselineValue =
        key in SLOT_PROP_DEFAULTS ? SLOT_PROP_DEFAULTS[key] : targetRecord[key];
      applied.nativeBaselines.set(key, assignmentSlotValue(baselineValue));
    }
    const snapshot = snapshotSlotValue(value);
    let property = applied.properties.get(key);
    if (!property) {
      property = {
        initialized: false,
        observable: isObservableSlotProperty(target, key),
        requestedSnapshot: undefined,
        targetSnapshot: undefined,
      };
      applied.properties.set(key, property);
    }
    const targetSnapshot = snapshotSlotValue(targetRecord[key]);
    if (
      !isCacheableSlotValue(value) ||
      !property.observable ||
      !property.initialized ||
      !Object.is(property.requestedSnapshot, snapshot) ||
      !Object.is(property.targetSnapshot, targetSnapshot)
    ) {
      targetRecord[key] = assignmentSlotValue(value);
      property.initialized = true;
      property.requestedSnapshot = snapshot;
      property.targetSnapshot = property.observable
        ? snapshotSlotValue(targetRecord[key])
        : undefined;
    }
  }
}

// biome-ignore lint/suspicious/noExplicitAny: mixin needs to accept any constructor signature
type Constructor<T = object> = new (...args: any[]) => T;

interface RequestRenderable {
  requestRender(): void;
}

/**
 * Named instance surface returned by {@link withStyles}. Keeping this type
 * explicit lets declaration emit describe the mixin without leaking an
 * anonymous class containing protected members.
 */
export declare abstract class StyledMixinRenderable<
  S extends StyleState,
  R extends Styles,
> {
  protected _defaultStyles?: R;
  protected _styles?: R;
  protected _styleResolver?: StyleResolver<S, R>;
  protected _rootStyleBaseline: object;

  public abstract getState(): S;
  protected onStylesChanged(): void;
  protected notifyStateChanged(): void;
  protected mergeStyles(base: R | undefined, override: R | undefined): R;
  protected getAuthoredStyles(): R;
  protected getResolvedStyles(): R;

  get styles(): R;
  set styles(value: R);
  get styleResolver(): StyleResolver<S, R> | undefined;
  set styleResolver(value: StyleResolver<S, R> | undefined);
}

type StyledMixinConstructor<
  S extends StyleState,
  R extends Styles,
  TBase extends Constructor<RequestRenderable>,
> = {
  [K in keyof TBase]: TBase[K];
} & (abstract new (
  ...args: ConstructorParameters<TBase>
) => InstanceType<TBase> & StyledMixinRenderable<S, R>);

/**
 * Mixin factory that adds the styled-config protocol to any
 * Renderable-shaped base class, including
 * OpenTUI's primitive and input Renderables.
 *
 * Two-phase generic call: `withStyles<S, R>()(Base)`. Required because
 * TypeScript can't infer S/R from `Base` alone.
 *
 * @example
 * ```ts
 * import { InputRenderable as OtuiInputRenderable } from "@opentui/core";
 *
 * const InputBase = withStyles<InputState, InputSlotStyles>()(OtuiInputRenderable);
 *
 * export class InputRenderable extends InputBase {
 *   public getState(): InputState { ... }
 *   protected override renderSelf(buffer): void {
 *     const root = this.getResolvedStyles().root ?? {};
 *     // push resolved colors into the inherited opentui setters ...
 *     super.renderSelf(buffer);
 *   }
 * }
 * ```
 */
export function withStyles<S extends StyleState, R extends Styles>() {
  return <TBase extends Constructor<RequestRenderable>>(
    Base: TBase,
  ): StyledMixinConstructor<S, R, TBase> => {
    abstract class StyledMixinBase extends Base {
      protected _defaultStyles?: R;
      protected _styles?: R;
      protected _styleResolver?: StyleResolver<S, R>;
      protected _rootStyleBaseline: object = {};

      private declarativeRootPropsEqual(next: object): boolean {
        const currentEntries = Object.entries(this._rootStyleBaseline);
        const nextRecord = next as Record<string, unknown>;
        if (currentEntries.length !== Object.keys(nextRecord).length) {
          return false;
        }
        return currentEntries.every(([key, value]) =>
          Object.is(value, nextRecord[key]),
        );
      }

      /** Subclass returns the runtime state used by the resolver and selectors. */
      public abstract getState(): S;

      /**
       * Hook fired whenever `styles` or `styleResolver` changes. The base
       * setter calls `requestRender()` automatically afterwards.
       */
      protected onStylesChanged(): void {}

      protected notifyStateChanged(): void {
        this.onStylesChanged();
        this.requestRender();
      }

      protected mergeStyles(base: R | undefined, override: R | undefined): R {
        const result = { ...(base ?? {}) } as Record<string, unknown>;
        for (const [key, value] of Object.entries(override ?? {})) {
          const previous = result[key];
          result[key] =
            previous &&
            value &&
            typeof previous === "object" &&
            typeof value === "object"
              ? { ...previous, ...value }
              : value;
        }
        return result as R;
      }

      protected getAuthoredStyles(): R {
        if (!this._styleResolver) {
          return this._styles ?? ({} as R);
        }
        return this.mergeStyles(
          this._styles,
          this._styleResolver(this.getState()),
        );
      }

      protected getResolvedStyles(): R {
        return this.mergeStyles(this._defaultStyles, this.getAuthoredStyles());
      }

      get styles(): R {
        return this.getResolvedStyles();
      }

      set styles(value: R) {
        this._styles = value;
        this.onStylesChanged();
        this.requestRender();
      }

      get styleResolver(): StyleResolver<S, R> | undefined {
        return this._styleResolver;
      }

      set styleResolver(value: StyleResolver<S, R> | undefined) {
        if (this._styleResolver === value) return;
        this._styleResolver = value;
        this.onStylesChanged();
        this.requestRender();
      }

      set __otuiDeclarativeRootProps(value: object) {
        // Framework adapters use this final reconciliation write to refresh
        // declarative ownership. Direct imperative writes are intentionally
        // outside this baseline.
        if (this.declarativeRootPropsEqual(value)) return;

        const target = this as unknown as Record<string, unknown>;
        const previous = normalizeSlotProps(target, this._rootStyleBaseline);
        const next = normalizeSlotProps(target, value);
        for (const key of Object.keys(previous)) {
          if (next[key] === undefined && key in SLOT_PROP_DEFAULTS) {
            resetSlotProp(target, key, SLOT_PROP_DEFAULTS[key]);
          }
        }

        this._rootStyleBaseline = value;
        this.onStylesChanged();
      }
    }
    return StyledMixinBase as unknown as StyledMixinConstructor<S, R, TBase>;
  };
}
