# Tabs Primitive contract

## Product boundary

Tabs is a packaged Primitive because selection, dynamic Tab/Panel association,
rendered-order navigation, roving focus, repair, and retained-panel lifecycle
would otherwise be repeated by applications. Core owns that behavior. Recipes
own labels, borders, spacing, colors, glyphs, and panel content. OpenTUI's
`TabSelect` remains the appropriate fixed-tree, option-drawing control; Tabs
does not wrap it because its `Root`, `List`, `Tab`, and `Panel` are genuine,
independently composable Renderables.

## Public shape and ownership

- `Tabs.Root` is the non-focusable ownership boundary. It owns or receives one
  attachable `TabsStore` in Core. React and Solid create the Store and hide it.
- `Tabs.List` is the non-focusable rendered collection boundary. Exactly one
  live List may own a Store. It determines live Tab availability and rendered
  order, including Tabs nested in consumer layout nodes.
- `Tabs.Tab` is a pressable focus target with one unique string `value`.
- `Tabs.Panel` is the state-reflecting region associated by the same string
  `value`. At most one live Tab and one live Panel may use a value.
- A framework Part outside `Tabs.Root` fails with a part-specific error. Core
  callers pass the Store explicitly and compose matching Parts beneath the
  Root/List. Detached, hidden, destroyed, or mismatched Parts are unavailable.

`value`/`defaultValue` provide controlled/uncontrolled selection. The public
Root state is a frozen, referentially stable snapshot containing
`value: string | null`, `activationMode`, `disabled`, and `orientation`.
`onValueChange(value, details)` receives one frozen
`{ source: "imperative" | "keyboard" | "pointer" | "focus" }` detail. In
uncontrolled mode a valid request commits before callback. In controlled mode
it reports intent without committing. `undefined` releases control at the
last observed value. Redundant, disabled, or unavailable requests do not
notify. A Tab may be selected without a Panel so applications can omit or
lazily provide content; association remains observable on both Parts.

`TabsStore.select(value)` and `TabsTabRenderable.select()` are semantic
imperative actions. `TabsTabRenderable.press()` uses the shared press gesture
contract. Refs resolve to the actual Root, List, Tab, or Panel Core Renderable.

## Selection, activation, focus, and repair

`activationMode` is `"automatic"` by default or `"manual"`:

- Enter/Return, Space, and primary pointer activation select a Tab.
- Left/Right navigate a horizontal List; Up/Down navigate a vertical List.
  Home/End move to the first/last eligible Tab. Navigation wraps unless
  `loopFocus={false}`. Cancelled keys and modifier chords are ignored.
- Navigation always moves actual OpenTUI focus. Automatic mode also selects
  the focused Tab with `source: "focus"`; manual mode leaves selection alone
  until activation.
- Only one eligible Tab is tabbable. The selected eligible Tab is preferred,
  then the focused/retained stop, then the first eligible Tab.

Registration follows visible rendered List order. Disabled Tabs remain
mounted but cannot focus, navigate, or select. Tabs are unavailable while
their List or owning tree is hidden/detached, while they are hidden/detached,
or after teardown. Owning-tree availability is reconciled by OpenTUI lifecycle
passes as well as direct Root/List visibility and removal hooks because hidden
subtrees do not receive ordinary layout updates. Panels are unavailable when
hidden/detached for a reason other than Tabs' own inactive visibility.

When the selected Tab becomes disabled, unavailable, detached, or destroyed,
uncontrolled selection repairs to the nearest eligible Tab in rendered order
(next, then previous), or `null`. Initial uncontrolled selection similarly
adopts the first eligible Tab if
there was no usable default. Repair is internal lifecycle reconciliation and
does not emit `onValueChange`. Controlled selection is never rewritten; its
Panel remains inactive until the owner supplies an eligible associated value.
If the focused Tab becomes ineligible, focus moves to the same nearest
fallback independently of selection ownership. A rejected controlled
automatic-selection request does not manufacture focus ownership: the actual
focused Tab remains the roving tab stop even when the controlled selected Tab
is different.

## Panels and lifecycle

A Panel is active only when its value is the current selection and its matching
Tab is live and eligible. A constructed Core Panel remains mounted and keeps
its native `visible` property synchronized with active state. Its frozen state
contains `active`, `associated`, and `value`.

React and Solid Panels are conditional by default: an inactive Panel has no
Renderable and its ref is cleared. Conditional mounting uses Core's
authoritative active-and-associated state, not selected-value equality, so an
invalid controlled value never fabricates an active first frame. `keepMounted`
retains the same Panel Renderable and reflects inactivity through
`visible=false`; reactive state or
prop changes do not replace retained Root, List, Tab, Panel, or Store identity.
`keepMounted` is adapter mounting policy and is not forwarded as an OpenTUI
property.

Mount registers Tabs and Panels; destroy, framework unmount, or direct parent
removal unregisters exactly once. OpenTUI removal has no matching reattachment
hook, so a detached Tabs Part has permanently ended its coordination lifetime
and must be replaced rather than reattached as the same Renderable. It remains
inert even if physically reinserted into a live tree. List teardown recursively
ends descendant Tab coordination and releases order/availability ownership.
Root teardown recursively ends all same-Store descendant List, Tab, and Panel
coordination before releasing its Store claim and subscriptions; an adopted
Store remains reusable by an immediate complete replacement tree. Every Part
tears down Store subscriptions, registration, focus ownership, callbacks, and
refs exactly once. Reentrant callbacks and dynamic registration are serialized
by Core.

## Conformance evidence plan

| Surface | Applicability and evidence |
| --- | --- |
| Core | Applicable. Public Store/Renderable tests own controlled and uncontrolled selection, frozen state/details, all actions and input sources, automatic/manual activation, rendered order, association, disabled/unavailable behavior, focus/selection repair, panel visibility, dynamic lifecycle, reentrancy, and teardown. |
| React | Applicable. Real `testRender` tests own first-render Store authority, controlled frame consistency, prop removal and callback replacement, actual refs, retained identity, default/retained Panel ref lifecycle, Strict Mode, context errors, subscription teardown, and one interaction round-trip. |
| Solid | Applicable. The adapter matrix is repeated through signals and Solid's real renderer, including cleanup and one interaction round-trip. |
| Registry | Applicable. Core, React, and Solid Recipes import only `/tabs`, compile in isolated strict consumers, mount, perform one selection round-trip, prove Recipe-owned presentation, and restyle from the consumer-owned Theme. |
| Packed | Applicable. All three `/tabs` subpaths are included in tarball declaration and runtime-import checks; the compiled packed-consumer check executes representative Core Tabs selection behavior. |
| Terminal | N/A. Tabs has no renderer-root portal, global listener, restoration, or platform sequence hidden from the real OpenTUI test renderer. Core tests drive actual focus, keys, pointer coordinates, rendered order, and Panel visibility end to end, so a second PTY demo would duplicate lower-seam evidence. |

OpenTUI-native ownership is **N/A** because Tabs owns selection rather than
adapting an OpenTUI mutable control. Overlay dismissal/restoration is **N/A**
because no Tabs Part crosses renderer-root ownership or creates a layer.
Cancellation is **N/A** because selection requests have no synchronously
cancelable default action; controlled ownership is the intent-only seam.
