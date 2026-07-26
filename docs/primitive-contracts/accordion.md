# Accordion Primitive contract

## Product boundary

Accordion is a packaged Primitive because coordinated single or multiple open
state, per-Item disablement, equivalent keyboard and pointer activation, and
Panel lifecycle would otherwise be repeated by applications. Core owns that
behavior. Recipes own headers, labels, disclosure glyphs, layout, spacing,
colors, and Panel content.

## Public shape and ownership

- `Accordion.Root` owns or adopts one `AccordionStore` in Core. React and Solid
  create the Store and hide it from framework consumers.
- `Accordion.Item` registers one required, unique string `value` and scopes its
  Trigger and Panel. It may supply `disabled` and `onOpenChange`.
- `Accordion.Trigger` is the pressable focus target that toggles its Item.
- `Accordion.Panel` reflects its Item state. A constructed Core Panel remains
  mounted and synchronizes native visibility with open state.
- `Accordion.Header` is Recipe structure, not a packaged Part. HTML heading
  semantics do not create terminal behavior.
- Framework Items require Root context; Trigger and Panel require Item context.
  Core callers pass the matching Item explicitly.

Root `value` and `defaultValue` are readonly string arrays. Values are
deduplicated while preserving order. Single mode, the default, retains at most
one value; `multiple` permits more than one. A Trigger may close its currently
open Item, including in single mode.

Root state is a frozen, referentially stable snapshot containing `value`,
`disabled`, and `multiple`. Item and Panel state contain the Item's `value`,
`open`, and effective `disabled`; Trigger state adds actual `focused` state.
Root disablement combines with Item disablement.

`onValueChange(value, details)` and Item `onOpenChange(open, details)` receive
frozen press details with `source: "imperative" | "keyboard" | "pointer"`.
An accepted uncontrolled request commits before Item and then Root callbacks.
A controlled request reports intent without committing. Passing `undefined`
after a controlled value releases control at the last observed value. Disabled
or no-op requests do not notify.

`AccordionStore.setValue()` supplies or releases controlled ownership without
callbacks. `AccordionStore.toggleItem()` and
`AccordionTriggerRenderable.press()` are semantic requests. Refs resolve to
the actual matching Core Renderable.

## Interaction and lifecycle

An uncancelled, unmodified Enter, Return, or Space press activates Trigger. An
uncancelled primary pointer press must start and end on Trigger. Invalid or
modified input is not consumed. Up and Down move focus between available
Triggers; Home and End move to the first and last available Trigger. Focus does
not wrap and navigation never changes open state. This terminal-only addition
compensates for the absence of browser-native Tab traversal; it does not expose
the deprecated Base UI orientation or loop policy.

Disabling Root or Item makes its Trigger non-focusable and inert. Disabling
while focused blurs Trigger. Opening and closing otherwise retain Trigger
focus and do not move focus into Panel.

React and Solid Panels are conditional by default. `keepMounted` retains the
same Panel Renderable and reflects closed state through `visible=false`. Core
callers choose whether to construct a Panel; a constructed Panel remains
mounted and synchronizes visibility.

Live Item values must be unique. Renaming an open uncontrolled Item repairs the
Root value without callbacks. Removing an open uncontrolled Item removes its
value without callbacks. Controlled values remain authoritative even when they
name no live Item. Removing an Item directly repairs uncontrolled value;
ending a complete Root preserves an externally owned Store's value so a
replacement Root can adopt it. Removing or destroying Root or Item permanently ends its
same-owner descendant coordination lifetimes. Teardown is idempotent.

## Conformance evidence plan

| Surface | Applicability and evidence |
| --- | --- |
| Core | Store and Renderable tests own normalization, controlled/uncontrolled single and multiple state, callback order, duplicate values, rename/removal repair, semantic actions, keyboard/pointer activation, effective disablement, focus, Panel visibility, teardown, and immutable snapshots/details. |
| React | Real renderer tests own authoritative first render, prop and callback replacement, Root/Item context, actual refs, default and retained Panel lifecycle, controlled interaction, Strict Mode, and orphan errors. |
| Solid | The adapter matrix is repeated through signals and Solid's real renderer, including reactive Item props and cleanup. |
| Registry | Core, React, and Solid Recipes install in isolated consumers, compile, open an Item, render Recipe-owned presentation, and react to Theme changes. |
| Packed | All three `/accordion` subpaths participate in declaration, runtime-import, and representative packed-consumer checks. |
| Terminal | N/A. Core's real OpenTUI test renderer covers focus, keyboard, pointer, and visibility; Accordion has no renderer-global listener, portal, ordering, dismissal, or restoration sequence. |

OpenTUI-native state ownership, unavailable-item repair, overlay coordination,
and cancellation are N/A. A public Root state hook is N/A until a shipped
Recipe needs supplementary Root state outside Part render callbacks.
