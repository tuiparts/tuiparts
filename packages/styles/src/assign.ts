import { RGBA } from "@opentui/core";

type StylePropExclusions =
  | "id"
  | "content"
  | "children"
  | "label"
  | "placeholder"
  | "title"
  | "description"
  | "value"
  | "defaultValue"
  | "checked"
  | "defaultChecked"
  | "open"
  | "defaultOpen"
  | "disabled"
  | "readOnly"
  | "focusable"
  | "selectable"
  | "enableLayout"
  | "buffered"
  | "live"
  | "renderBefore"
  | "renderAfter"
  | "ref"
  | "store"
  | `on${string}`;

/** OpenTUI options that a recipe may treat as presentation. */
export type StyleProps<T> = Omit<T, StylePropExclusions>;

/** Normalized style surface for OpenTUI text-like options. */
export type TextStyleProps<T extends { fg?: unknown; bg?: unknown }> = Omit<
  StyleProps<T>,
  "fg" | "bg"
> & {
  color?: T["fg"];
  backgroundColor?: T["bg"];
};

interface AssignedProperty {
  observable: boolean;
  requestedSnapshot: unknown;
  targetSnapshot: unknown;
}

interface AssignedTarget {
  nativeValues: Map<string, unknown>;
  properties: Map<string, AssignedProperty>;
}

const assignedTargets = new WeakMap<object, AssignedTarget>();

const NATIVE_STYLE_DEFAULTS: Record<string, unknown> = {
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
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  maxHeight: undefined,
  maxWidth: undefined,
  minHeight: undefined,
  minWidth: undefined,
  opacity: 1,
  overflow: "visible",
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  position: "relative",
  rowGap: 0,
  visible: true,
  width: "auto",
  zIndex: 0,
};

function snapshot(value: unknown): unknown {
  return value instanceof RGBA ? value.buffer.join(",") : value;
}

function assignmentValue(value: unknown): unknown {
  return value instanceof RGBA ? RGBA.clone(value) : value;
}

function isCacheable(value: unknown): boolean {
  return value === null || typeof value !== "object" || value instanceof RGBA;
}

function isObservable(target: object, key: string): boolean {
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

function normalize(
  target: Record<string, unknown>,
  props: object | undefined,
): Record<string, unknown> {
  const source = (props ?? {}) as Record<string, unknown>;
  const normalized = { ...source };

  if (source.color !== undefined) {
    if ("fg" in target) normalized.fg = source.color;
    else if ("textColor" in target) normalized.textColor = source.color;
    delete normalized.color;
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

  for (const [shorthand, edges] of [
    ["padding", ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]],
    ["paddingX", ["paddingRight", "paddingLeft"]],
    ["paddingY", ["paddingTop", "paddingBottom"]],
    ["margin", ["marginTop", "marginRight", "marginBottom", "marginLeft"]],
    ["marginX", ["marginRight", "marginLeft"]],
    ["marginY", ["marginTop", "marginBottom"]],
    ["gap", ["rowGap", "columnGap"]],
  ] as const) {
    const value = source[shorthand];
    if (value !== undefined) {
      for (const edge of edges) normalized[edge] = value;
    }
    delete normalized[shorthand];
  }

  for (const edge of [
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "rowGap",
    "columnGap",
  ]) {
    if (source[edge] !== undefined) normalized[edge] = source[edge];
  }

  return normalized;
}

/**
 * Assign one resolved recipe slot to an existing OpenTUI Renderable.
 * Omitted properties return to the native value captured before the recipe
 * first assigned them. No component props, defaults, or authored layers are
 * retained here; the recipe resolver owns those decisions.
 */
export function assignStyleProps(
  target: object,
  props: object | undefined,
): void {
  const targetRecord = target as Record<string, unknown>;
  const next = normalize(targetRecord, props);
  let assigned = assignedTargets.get(target);

  if (!assigned && Object.keys(next).length === 0) return;
  if (!assigned) {
    assigned = { nativeValues: new Map(), properties: new Map() };
    assignedTargets.set(target, assigned);
  }

  for (const [key] of assigned.properties) {
    if (next[key] !== undefined) continue;
    targetRecord[key] = assignmentValue(assigned.nativeValues.get(key));
    assigned.properties.delete(key);
  }

  for (const [key, value] of Object.entries(next)) {
    if (value === undefined) continue;
    if (!assigned.nativeValues.has(key)) {
      const nativeValue =
        key in NATIVE_STYLE_DEFAULTS
          ? NATIVE_STYLE_DEFAULTS[key]
          : targetRecord[key];
      assigned.nativeValues.set(key, assignmentValue(nativeValue));
    }

    const requestedSnapshot = snapshot(value);
    const existing = assigned.properties.get(key);
    const observable = existing?.observable ?? isObservable(target, key);
    const targetSnapshot = snapshot(targetRecord[key]);
    const shouldAssign =
      !existing ||
      !isCacheable(value) ||
      !observable ||
      !Object.is(existing.requestedSnapshot, requestedSnapshot) ||
      !Object.is(existing.targetSnapshot, targetSnapshot);

    if (shouldAssign) targetRecord[key] = assignmentValue(value);
    assigned.properties.set(key, {
      observable,
      requestedSnapshot,
      targetSnapshot: observable ? snapshot(targetRecord[key]) : undefined,
    });
  }
}
