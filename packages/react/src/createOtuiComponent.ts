import { createElement, extend } from "@opentui/react";
import { $$OtuiComponentMeta, type ComponentMeta } from "@opentui-ui/styles";
import type { ReactElement } from "react";

export type OtuiComponent<
  Props extends object,
  Slots extends readonly string[],
  SlotStyleMap extends Record<Slots[number], object>,
  StateKeys extends readonly string[],
> = {
  (props: Props): ReactElement;
  [$$OtuiComponentMeta]: ComponentMeta<Slots, SlotStyleMap, StateKeys>;
  displayName?: string;
};

/**
 * Factory that consumes a Renderable subclass and its `*_META` and emits a
 * typed React component.
 *
 * The reconciler intrinsic tag is read from `meta.tag` — there is no separate
 * magic string to keep in sync. Adding the next component is one factory call
 * per adapter, with the same `*_META` powering both the styled() inference and
 * the registration.
 *
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
    function OtuiComponent(props: Props): ReactElement {
      return createElement(meta.tag, {
        ...props,
        __otuiDeclarativeRootProps: props,
      } as Record<string, unknown>);
    },
    {
      [$$OtuiComponentMeta]: meta,
    },
  );

  return Component;
}
