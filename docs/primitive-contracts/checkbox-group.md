# CheckboxGroup Primitive contract

## Product boundary

CheckboxGroup is a packaged Primitive because array-valued checked ownership,
dynamic Checkbox registration, effective disablement, rendered-order focus
navigation, and lifecycle coordination would otherwise be repeated by
applications. Core owns that behavior. Recipes own labels, marks, layout,
spacing, colors, and grouping decoration.

## Public shape and ownership

- `CheckboxGroup` is a single non-focusable Root that owns or adopts one
  `CheckboxGroupStore` in Core. React and Solid create the Store and hide it
  from framework consumers.
- Existing `Checkbox.Root` remains a complete standalone control. Inside a
  framework CheckboxGroup it optionally adopts that group's Store; Core callers
  pass the group Store explicitly.
- A grouped Checkbox requires a unique string `value`. Its existing Indicator
  continues to consume the same Checkbox Store and needs no group-specific
  Part.
- There is no packaged `CheckboxGroup.Item`: it would duplicate Checkbox.Root's
  behavior ownership rather than represent an independently composable node.

A standalone Checkbox owns controlled or uncontrolled `checked` state. A
grouped Checkbox derives `checked` from whether CheckboxGroup `value` contains
its identity; its `checked` and `defaultChecked` inputs do not override group
ownership. CheckboxGroup `value` and `defaultValue` are readonly string arrays,
deduplicated while preserving order.

CheckboxGroup state is a frozen, referentially stable snapshot containing
`value`, `disabled`, and `orientation`. Grouped Checkbox state contains
`checked`, effective `disabled`, actual `focused`, and `tabbable`. Root
disablement combines with Checkbox-local disablement.

A grouped activation commits an uncontrolled group request before invoking the
Checkbox `onCheckedChange(checked, details)` callback and then
`CheckboxGroup.onValueChange(value, details)`. A controlled request reports
intent without committing. Details are frozen shared press details with
`source: "imperative" | "keyboard" | "pointer"`. Passing `undefined` after a
controlled group value releases control at the last observed value. Disabled,
unavailable, or no-op requests do not notify.

## Interaction and lifecycle

Enter, Return, Space, primary-pointer release, and `press()` toggle the focused
Checkbox through the same Pressable contract. Orientation selects Left/Right
or Up/Down rendered-order navigation; Home and End move to the first and last
available Checkbox. Navigation does not change checked state and wraps by
default; `loopFocus={false}` stops at collection edges.

Only the roving tab stop is focusable in a live group. Navigation skips local
or Root-disabled, hidden, detached, and destroyed Checkboxes. Disabling,
hiding, removing, or destroying the focused Checkbox repairs focus to the
nearest available member. Removing the group permanently ends descendant group
registrations.

Live grouped values must be unique. Renaming a checked uncontrolled Checkbox
repairs the group value without callbacks. Removing a Checkbox preserves the
value, matching ToggleGroup: conditional controls recover their checked state
when the same value remounts, while controlled values may always name no live
Checkbox. Teardown is idempotent and released registrations cannot reactivate.

## Conformance evidence plan

| Surface | Applicability and evidence |
| --- | --- |
| Core | CheckboxGroup Store/Renderable and grouped Checkbox tests own normalization, controlled/uncontrolled ownership, callback order/details, registration, uniqueness, rename, activation, effective disablement, rendered-order navigation, availability, focus repair, and teardown. Existing standalone Checkbox coverage remains green. |
| React | Real renderer tests own authoritative first render, controlled prop removal, callback replacement, context adoption, actual refs, retained Store/Renderable identities, conditional registration, Strict Mode, and subscription teardown. |
| Solid | The adapter matrix is repeated through signals and Solid's real renderer, including reactive group and Checkbox props and cleanup. |
| Registry | Core, React, and Solid Recipes install in isolated consumers, compile, toggle one Item, render Recipe-owned labels and marks, and react to Theme changes. |
| Packed | All three `/checkbox-group` subpaths participate in declaration, runtime-import, and representative packed-consumer checks. |
| Terminal | Runnable Core, React, and Solid tracers verify rendered focus movement and activation across multiple grouped Checkboxes. |

Conditional Parts, overlay coordination, unavailable-selection fallback, and
public Root state hooks are N/A. Checkbox Indicator retains its existing Core
visibility and framework mounting contract; no Recipe requires supplementary
Root state outside Checkbox render callbacks.
