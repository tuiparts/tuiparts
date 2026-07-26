# Collapsible Primitive contract

## Product boundary

Collapsible is a packaged Primitive because open-state ownership, equivalent
keyboard and pointer activation, disabled gating, focus reflection, and
conditional Panel lifecycle would otherwise be repeated by applications. Core
owns that behavior. Recipes own labels, disclosure glyphs, layout, spacing,
colors, animation, and Panel content.

## Public shape and ownership

- `Collapsible.Root` is the non-focusable ownership boundary. It owns or
  receives one attachable `CollapsibleStore` in Core. React and Solid create
  the Store and hide it from framework consumers.
- `Collapsible.Trigger` is the pressable focus target that requests the inverse
  open state.
- `Collapsible.Panel` is the state-reflecting content region. A constructed
  Core Panel remains mounted and synchronizes native visibility with open
  state.
- A framework Part outside `Collapsible.Root` fails with a part-specific error.
  Core callers pass the Store explicitly and compose matching Parts beneath
  the Root.

`open` and `defaultOpen` provide controlled and uncontrolled ownership. The
public Root state is a frozen, referentially stable snapshot containing `open`
and `disabled`. Trigger state extends those facts with actual `focused` state;
Panel state contains `open`.

`onOpenChange(open, details)` receives one frozen press detail with
`source: "imperative" | "keyboard" | "pointer"`. In uncontrolled mode a valid
request commits before the callback. In controlled mode it reports intent
without committing. Passing `undefined` after a controlled value releases
control at the last observed value. Disabled requests do not notify.

`CollapsibleStore.toggle()`, `CollapsibleStore.setOpen()`, and
`CollapsibleTriggerRenderable.press()` are semantic actions. `setOpen()` and
`toggle()` report an imperative request through the same ownership and callback
rules as Trigger activation. `setControlledOpen()` supplies or releases an
external owner's authoritative value without emitting `onOpenChange`. Refs
resolve to the actual Root, Trigger, or Panel Core Renderable.

## Interaction and lifecycle

An uncancelled, unmodified Enter, Return, or Space press activates Trigger.
An uncancelled primary pointer press must start and end on Trigger. Keyboard,
pointer, and imperative activation share `PressableRenderable`; invalid or
modified interactions are not consumed.

Root disablement makes Trigger non-focusable and inert. Disabling while Trigger
is focused blurs it. Opening and closing otherwise retain actual Trigger focus.
Collapsible does not move focus into Panel or back to Trigger because no open
transition moves it away.

React and Solid Panels are conditional by default: a closed Panel has no
Renderable and its ref is cleared. `keepMounted` retains the same Panel
Renderable and reflects closed state through `visible=false`. `keepMounted` is
adapter mounting policy and is not forwarded as an OpenTUI property. A Core
caller chooses whether to construct a Panel; a constructed Panel remains
mounted and synchronizes visibility.

Mounting claims one Root coordination lifetime. Removing or destroying Root
permanently ends every same-Store descendant Trigger and Panel lifetime before
releasing Store ownership. Removing a Part releases its subscriptions and
makes that Renderable inert even if physically reattached. Teardown is
idempotent. An externally created Store may be adopted by a new complete Root
after the previous Root releases it.

## Conformance evidence plan

| Surface | Applicability and evidence |
| --- | --- |
| Core | Applicable. Public Store and Renderable tests own controlled/uncontrolled state, frozen snapshots/details, semantic actions, keyboard/pointer wiring, disabled gating, focus, Panel visibility, Root/Part teardown, reentrancy, and retained identity. |
| React | Applicable. Real `testRender` tests own authoritative first render, controlled frame consistency, prop removal, callback replacement, actual refs, retained identity, default/retained Panel ref lifecycle, Strict Mode, subscription teardown, context errors, and one interaction round-trip. |
| Solid | Applicable. The adapter matrix is repeated through signals and Solid's real rendering seam, including cleanup and one interaction round-trip. |
| Registry | Applicable. Core, React, and Solid Recipes import only `/collapsible`, compile in isolated strict consumers, mount, perform one open-state round-trip, prove Recipe-owned presentation, and restyle from the consumer-owned Theme. |
| Packed | Applicable. All three `/collapsible` subpaths are included in tarball declaration and runtime-import checks; the compiled packed-consumer check executes representative Core Collapsible behavior. |
| Terminal | N/A. Core tests use the real OpenTUI test renderer to prove focus, keyboard, pointer, and Panel visibility. Collapsible has no renderer-global listener, portal, ordering, dismissal, or restoration sequence hidden from that seam. |

OpenTUI-native state ownership is **N/A** because Collapsible owns its boolean
open state. Collection registration and unavailable-item repair are **N/A**
because Collapsible has no dynamic collection or selectable items. Overlay
coordination and cancellation are **N/A** because Collapsible creates no layer
and open requests have no synchronously cancellable default action. A public
Root state hook is **N/A** because no current Recipe composition consumer needs
Root state outside Trigger or Panel state callbacks; ADR-0010 forbids adding
that supplementary surface speculatively.
