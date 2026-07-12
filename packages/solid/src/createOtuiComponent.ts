import type { JSX } from "@opentui/solid";
import { createElement, extend, spread } from "@opentui/solid";
import { $$OtuiComponentMeta, type ComponentMeta } from "@opentui-ui/styles";

export type OtuiComponent<
  Props extends object,
  Slots extends readonly string[],
  SlotStyleMap extends Record<Slots[number], object>,
  StateKeys extends readonly string[],
> = {
  (props: Props): JSX.Element;
  [$$OtuiComponentMeta]: ComponentMeta<Slots, SlotStyleMap, StateKeys>;
};

/**
 * Factory that consumes a Renderable subclass and its `*_META` and emits a
 * typed Solid component.
 *
 * The reconciler intrinsic tag is read from `meta.tag` — there is no separate
 * magic string to keep in sync. Reactivity is preserved by spreading the
 * original Solid props proxy directly.
 *
 * @example
 * ```ts
 * import { createOtuiComponent } from "@opentui-ui/solid";
 * import { BADGE_META, type BadgeOptions, BadgeRenderable } from "@opentui-ui/core/badge";
 *
 * export const Badge = createOtuiComponent<BadgeOptions, ...>(
 *   BadgeRenderable,
 *   BADGE_META,
 * );
 * ```
 */
export function createOtuiComponent<
  Props extends object,
  Slots extends readonly string[],
  SlotStyleMap extends Record<Slots[number], object>,
  StateKeys extends readonly string[],
>(
  // biome-ignore lint/suspicious/noExplicitAny: opentui Renderable constructor shape
  Renderable: new (...args: any[]) => any,
  meta: ComponentMeta<Slots, SlotStyleMap, StateKeys>,
): OtuiComponent<Props, Slots, SlotStyleMap, StateKeys> {
  extend({ [meta.tag]: Renderable });

  const Component = Object.assign(
    function OtuiComponent(props: Props): JSX.Element {
      const el = createElement(meta.tag);
      spread(el, () => ({
        ...props,
        __otuiDeclarativeRootProps: { ...props },
      }));
      return el;
    },
    {
      [$$OtuiComponentMeta]: meta,
    },
  );

  return Component;
}
