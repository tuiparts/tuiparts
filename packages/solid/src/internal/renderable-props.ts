import { spread } from "@opentui/solid";
import type { Ref } from "solid-js";

export function setRenderableRef<T>(
  ref: Ref<T> | undefined,
  value: T | undefined,
): void {
  // SAFETY: Primitive adapters call this helper only with non-callable Core
  // Renderables. Solid's Ref<T> also permits callable T values, so narrowing
  // with typeof cannot exclude that generic branch even though it is
  // impossible at these call sites.
  if (typeof ref === "function") (ref as (value: T | undefined) => void)(value);
}

/**
 * Reactively applies Solid props to an existing Renderable and clears keys
 * that disappear from a dynamic prop object.
 */
export function spreadRenderableProps<T extends object>(
  element: Parameters<typeof spread>[0],
  getProps: () => T,
): void {
  let previousKeys: string[] = [];
  spread(element, () => {
    const next = getProps();
    const removed = Object.fromEntries(
      previousKeys
        .filter((key) => !Object.hasOwn(next, key))
        .map((key) => [key, undefined]),
    );
    previousKeys = Object.keys(next);
    return { ...removed, ...next };
  });
}
