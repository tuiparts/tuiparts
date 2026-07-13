import { spread } from "@opentui/solid";
import type { Ref } from "solid-js";

export function setRenderableRef<T>(ref: Ref<T> | undefined, value: T): void {
  if (typeof ref === "function") (ref as (value: T) => void)(value);
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
    const next = getProps() as Record<string, unknown>;
    const removed = Object.fromEntries(
      previousKeys
        .filter((key) => !Object.hasOwn(next, key))
        .map((key) => [key, undefined]),
    );
    previousKeys = Object.keys(next);
    return { ...removed, ...next };
  });
}
