# Primitive Contract

## Status

This document defines the shared contract for v1 primitives. It is grounded in
the shipped Checkbox, RadioGroup, Input, and Dialog behavior. New primitives
and changes to existing primitives must conform to it.

[ADR-0009](docs/adr/0009-deliver-primitives-and-recipes-as-complete-verticals.md)
defines the mandatory implementation, test-ownership, Registry, packaging,
documentation, validation, and release workflow for delivering this contract
as a complete vertical.

The contract describes public behavior, not a required internal class layout.
Primitive-specific behavior still belongs in that primitive's public API and
tests.

## Boundary

A primitive packages reusable terminal interaction behavior. It may own state,
keyboard and pointer handling, focus, collection coordination, overlay
coordination, disabled behavior, lifecycle, and semantic actions.

A primitive must not choose:

- Colors, spacing, borders, dimensions, or themes.
- Glyphs, labels, messages, or other fixed content.
- Semantic visual variants such as intent, tone, or size.
- A fixed visual child tree beyond the public behavior-bearing parts required
  by its terminal interaction model.
- A styling-engine dependency.

Recipes own those choices in consumer-editable source. Behaviorless visual
components, such as Badge, are recipes rather than primitives.

OpenTUI remains the platform layer. A primitive preserves an OpenTUI control's
native behavior when OpenTUI already owns it instead of introducing a parallel
state machine. Input is the normative example.

## Vocabulary

### Primitive

A versioned, visually unstyled behavior module exported by
`@tuiparts/core`, with equivalent React and Solid adapters where applicable.
Primitive modules use component-specific package subpaths.

### Store

The framework-neutral owner of primitive state or cross-Renderable
coordination. A Store exposes readonly state, subscriptions, and semantic
requests or actions needed by Core consumers. Stores do not contain visual
defaults or framework state. A public Store must be attachable to its Core
Root; framework adapters normally create it automatically and omit it from
their consumer Props.

A thin wrapper around an OpenTUI-native control must not duplicate the
control's state merely to match Store-shaped primitives.

### Root

The ownership and composition boundary for one primitive instance. Root owns
primitive state directly or owns/receives a Store when coordination warrants
one, applies Root-level behavior, and provides the required owner to framework
parts. Root is not required to be focusable; focus ownership follows the
primitive's interaction model. A Root may coordinate focus without itself
being a focus target.

### Part

A named public Renderable with a behavior or semantic responsibility. Parts
are real composition nodes, not style slots. Consumers can reference them,
pass native OpenTUI properties, provide arbitrary children where supported,
and arrange them within the structural constraints documented by the
primitive.

A part that requires a Root, Item, Popup, or another owner must fail clearly
when used outside that owner in a framework adapter. Core consumers wire the
required Store or owner explicitly.

### State

A readonly public snapshot of observable primitive behavior. Root and Store
snapshots are referentially stable until observable state changes and are
immutable at runtime. Part-local state may extend Root state with facts such as `focused`,
`selected`, `available`, or `tabbable`.

Consumers read state through a documented `state` or `getState()` seam, a
subscription, or a framework state render callback. They do not mutate state
objects.

### Change Callback And Details

A change callback reports a semantic state-change request. Its first argument
is the requested next value. When cause matters, a second readonly Details
object reports a small primitive-specific vocabulary such as `reason`,
`source`, or `open`.

Details describe terminal semantics, not browser events. A callback fires at
most once for one semantic request. Details fields are readonly; a Details
object may retain only the internal flag needed by a documented cancellation
method. New reason and source strings are public API and require conformance
coverage.

Cancellation exists only for requests where the primitive can synchronously
honor it. A cancellable Details object exposes `preventDefault()` and
`defaultPrevented`; non-cancellable callbacks must not imply cancellation.
Dialog dismissal is the normative cancellable example. Cancellation prevents
the primitive's default transition and must not leak the interaction to a
lower overlay.

### Action

A semantic imperative operation exposed by a Store or Renderable, such as
`press()`, `focus()`, `submit()`, or `setOpen()`. Actions use the same disabled,
ownership, callback, event-detail, and coordination rules as keyboard and
pointer interaction. They are not arbitrary state-object mutation methods.

### Ref

A framework ref resolves to the actual Core Renderable for that public part,
not a wrapper handle. Its type is the corresponding Renderable class. Retained
parts preserve Renderable identity across reactive property and state updates.
Normal framework mount and unmount rules determine when a ref is set and
cleared.

### Lifecycle

Registration begins when a behavior-bearing part is mounted and ends when it
is destroyed or unmounted. Teardown must unsubscribe listeners, unregister
collection or overlay membership, release renderer-level listeners when no
longer needed, and repair focus or active ownership when required.

Root and collection Item identity must not be replaced merely because state
changes. A state-conditional part such as Indicator may be absent by default in
React and Solid when its state is inactive. A primitive may expose
`keepMounted` for a specific conditional part when consumers need retained
identity; this is not a universal prop. When supported, it retains that part
and reflects inactivity through Renderable visibility. Core callers own
whether they construct the part; a constructed state-reflecting part keeps its
visibility synchronized. Each primitive must document which parts are
conditional and whether they support retained mounting.

## Ownership

### Primitive-Owned State

Controlled and uncontrolled props are provided only for state the primitive
actually owns, such as Checkbox checked state, RadioGroup selection, and
Dialog open state.

- A defined controlled prop makes the external owner authoritative.
- A `defaultX` prop initializes uncontrolled state and is not reapplied.
- In uncontrolled mode, a valid non-cancellable request updates state before
  notifying the change callback.
- A cancellable request notifies before its default transition so synchronous
  cancellation can prevent that transition.
- In controlled mode, a valid request notifies the callback but does not
  commit the requested value until the controlled prop changes.
- Passing `undefined` for a previously controlled prop returns ownership to
  the primitive at its current observed value.
- Redundant, disabled, unavailable, or otherwise invalid requests do not emit
  a change callback.
- Reactive updates replace callbacks and controlled values without replacing
  retained Renderables or justified Stores.

The Core Root or Store is the behavior source in every mode. React and Solid
must not add a second ownership state machine around it.

### OpenTUI-Owned State

When OpenTUI owns mutable control state, the primitive preserves that model.
It does not add controlled rollback or a synthetic `defaultValue` merely for
cross-primitive uniformity. The preceding controlled/default rules do not
apply to that state.

For Input this means:

- `value` retains OpenTUI initialization and programmatic setter behavior.
- User editing mutates the OpenTUI Input directly.
- `input`, `change`, and `submit` retain OpenTUI meanings and ordering.
- React and Solid use standard OpenTUI event routing without duplicate events.
- Disabled behavior may gate focus, editing, and submission without replacing
  OpenTUI's editing state.

## Composition And Replacement

The v1 primitive contract supports explicit composition, not arbitrary part
replacement.

The supported seam is:

- Named Root and behavior-bearing parts.
- Arbitrary consumer children where the part's OpenTUI base supports them.
- Native OpenTUI options and properties, except properties reserved for
  primitive coordination.
- Readonly Root or Item state render callbacks in React and Solid.
- Typed Renderable refs and documented semantic actions.
- Explicit Store or owner injection in Core and context wiring in React and
  Solid.
- Consumer wrappers and recipe-owned visual nodes around or within parts.

Structural requirements remain explicit. For example, Radio.Root belongs to
RadioGroup, Radio.Indicator belongs to Radio.Root, and Dialog Popup and
Backdrop belong to the same Dialog Store and Portal layer. Portal is a real
renderer-root ownership host, not an ordinary in-tree visual wrapper.

The v1 primitive contract does not support a Base UI-style `render`, `asChild`,
or polymorphic `as` prop for replacing the underlying behavior-bearing
Renderable.
It also does not infer behavior by cloning arbitrary children. A recipe that
needs different presentation composes content inside public parts. A genuinely
different behavior-bearing Renderable requires a new evidenced primitive seam,
not an untyped escape hatch.

Reserved coordination properties on behavior-bearing parts, such as Dialog
layer visibility and z-index, cannot be overridden through native props. They
must be omitted from public option types or ignored deterministically.

## Core And Adapter Contract

Core is the source of behavior shared by frameworks:

- Justified Stores, Renderables, state snapshots, details, key maps, disabled behavior,
  collection logic, and overlay logic live in Core.
- React and Solid adapt Core lifecycle, context, reactivity, children, events,
  and refs. They do not reimplement the behavior state machine.
- React and Solid expose the same compound-part names, ownership props,
  conditional-part policy, state fields, details, actions, and ref targets.
- Framework-specific mechanics may differ only where required by the host
  reconciler. Observable terminal behavior must remain equivalent.
- Core composition passes a Store or owning Renderable explicitly. Framework
  adapters normally hide that wiring behind Root and part context.

Single-node OpenTUI-native controls use a named adapter such as
`Input` rather than inventing a compound `Root` with no composition
value.

Store interfaces remain component-specific. Public Stores must support a
coherent Core composition workflow rather than exist only for framework
adapter plumbing. Shared machinery should be extracted through private
composition only when multiple Stores demonstrate the same lifecycle and
notification semantics; primitive Stores do not inherit from a generic
public base class.

### Public Store Audit

- Button, Checkbox, Switch, and Toggle expose attachable Core Stores. Their React
  adapters create Stores automatically and omit `store` from public framework
  Props. Passive Indicator and Thumb parts receive the owning Store in
  Core and use private context wiring in framework adapters.
- Input preserves OpenTUI-owned state and has no Store.
- RadioGroup retains a public Store for dynamic item identity, selection,
  roving focus, ordering, and registration independent of any one Renderable.
- Dialog retains a public Store for portal, layer, dismissal, nesting, and
  focus-restoration coordination across renderer-root ownership.
- ToggleGroup retains a public Store for optional single or multiple
  selection, dynamic Toggle identity, rendered order, and roving focus. A
  standalone Toggle owns pressed state; a grouped Toggle reads selection from
  its group through the same Toggle Store before Renderable construction.

React creates a component-specific Core Store before host construction so state
callbacks and compound context are authoritative during the first render. The
same Store is passed to the Core Root constructor; there is no bridge or state
handoff. Framework Props and registry recipes do not accept Stores. See
`docs/adr/0001-react-primitive-store-adaptation.md` for the adapter call stack, consistency
invariants, considered alternatives, and removal path.

Solid adapters construct retained Renderables directly, so they preserve
reactive props with `splitProps`, take constructor snapshots with `untrack`,
adapt Renderable and Store subscriptions through one private helper based on
Solid's `from()`, and apply later property updates through one private
Renderable-prop helper. The property helper also clears keys removed from
dynamic prop objects, which the upstream spread seam does not currently do
itself.

## Interaction Rules

- Disabled behavior gates focus and semantic activation at every input seam,
  including imperative actions where applicable.
- Keyboard handlers consume only keys they handle. Press-activated primitives
  share one activation guard: an uncancelled, unmodified Space or Enter press.
  Cancelled keys and modifier chords are never consumed. Additional
  primitive-specific keys, such as roving-focus navigation, are documented per
  primitive and observe the same cancellation and modifier guards.
- Pointer handlers honor prior `defaultPrevented` state and supported button
  semantics before activating. Press-activated primitives share one pointer
  model: activation requires an uncancelled primary-button press that starts
  and ends on the node; releasing elsewhere, dragging off, or cancelling
  either half of the gesture abandons it.
- The shared activation guard, pointer model, disabled-driven focusability,
  and focus mirroring live in one internal Pressable behavior module
  (`core/src/internal/pressable.ts`); press-activated Roots do not
  re-implement them (ADR-0007).
- Actual focus belongs to OpenTUI Renderables. Stores may coordinate eligible
  targets, roving tab stops, restoration targets, and topmost ownership, but
  they do not invent a second focused node.
- Dynamic collection membership follows visible rendered order, skips disabled
  or unavailable items, and repairs tab-stop and focus ownership on removal.
- A disabled collection Item is mounted but semantically unavailable for
  focus, navigation, and selection because its Root or Item disabled state is
  true. An unavailable Item is not currently a live member of the rendered
  collection because it or its owning tree is hidden, detached, or destroyed.
  Unavailable Items are not tabbable or selectable and do not receive
  navigation focus. Availability is derived from Renderable lifecycle and is
  not a second consumer-controlled disabled prop.
- Overlay coordination is scoped to one OpenTUI render context. Escape,
  outside dismissal, focus containment, stacking, restoration, nesting, and
  teardown apply only to the topmost eligible layer.
- Dialog trigger, Escape, outside, Close, and Action requests are
  synchronously cancellable. Programmatic state changes are not. If a topmost
  layer cancels Escape or outside dismissal, it remains open and the same
  interaction is still consumed; no lower layer receives it. Controlled mode
  still reports a request but changes visible layer state only after the owner
  supplies the new `open` value.
- Public behavior is deterministic under prop removal, dynamic mount/unmount,
  reentrant callbacks, and teardown.

## Recipes

Recipes may omit optional semantic parts, wrap or reorder parts where the
primitive's structural rules permit it, and add arbitrary visual nodes. They
own layout, content, glyphs, styling, variants, and convenience props.

Recipe state styling reads public state or stable component metadata. It must
not reach into private Store fields, coordinator maps, reconciler internals, or
private Renderable fields. A style slot is recipe convenience and is never a
substitute for a required public primitive part.

Recipes depend on primitive package subpaths, not compatibility packages that
duplicate primitive behavior. They express presentation with ordinary
TypeScript and native OpenTUI properties.

## Unsupported Base UI Capabilities

The v1 primitive contract does not claim browser or Base UI parity. In
particular, it does not provide:

- DOM elements, ARIA attributes, HTML form participation, or browser label
  association.
- Browser `Event`, `PointerEvent`, or focus-event objects.
- Polymorphic `as`, `asChild`, arbitrary `render`, or child-cloning replacement
  APIs.
- CSS selectors, data attributes, CSS variables, or transition-presence
  contracts from primitive packages.
- Browser document portals, browser outside-interaction heuristics, or browser
  scroll locking.
- A universal orientation, locale, text-direction, or typeahead abstraction
  unless a terminal primitive independently proves and documents one.

Terminal equivalents are specified only where implemented and tested, such as
Renderable refs, OpenTUI key and mouse events, renderer-root Dialog portals,
readonly state callbacks, and recipe state metadata.

## Conformance Gates

Every new or hardened primitive records a matrix covering the applicable rows
below. `N/A` requires a reason; it is not a silent omission.

| Surface | Required evidence |
| --- | --- |
| Core | Public owner/Renderable tests for ownership, state snapshots, actions, key and pointer behavior, disabled behavior, dynamic lifecycle, teardown, and event details. Tests use the OpenTUI test renderer and public seams. |
| React | `testRender` coverage using real Core Renderables for first-render authoritative state, frame consistency for controlled updates through the Store, initial props, reactive updates, prop removal, callback replacement, actual ref targets, Renderable identity across retained updates, Store identity, conditional-part ref lifecycle, StrictMode and lifecycle, subscription teardown, context errors, and one interaction wiring round-trip per primitive; behavior semantics are proven once in Core. |
| Solid | The React adapter matrix repeated through Solid's real rendering seam, including reactive getters, cleanup, first-render authoritative state, frame consistency for controlled updates, prop removal, actual ref targets, retained Renderable identity, Store identity, subscription teardown, and one interaction wiring round-trip per primitive; behavior semantics are proven once in Core. |
| Registry | Core, React, and Solid recipes compile under strict TypeScript in clean consumers, import only published primitive subpaths, keep visual ownership local, and pass runtime smoke coverage: mounts, one prop round-trip, recipe-owned presentation, and theme restyle. Registry/theme keeps its full suite per ADR-0006 because the registry is the lowest layer for the theme module. Official shadcn validation and installation cover dependency metadata. |
| Packed | Built tarballs pass Publint, configured Are The Types Wrong checks, strict peer installation, declaration consumption, every documented subpath import, and runtime import smokes without workspace links. |
| Terminal | A runnable terminal sequence proves user-visible focus, key ordering, pointer or dismissal behavior, and restoration where unit seams cannot establish the complete sequence. |

The minimum behavioral dimensions are:

- Controlled and uncontrolled ownership when applicable.
- OpenTUI-native ownership when applicable.
- Disabled and unavailable behavior.
- Keyboard, pointer, and imperative action equivalence.
- Readonly state and stable event details.
- Dynamic registration, mount, unmount, visibility, and teardown.
- Ref targets and retained identity.
- Recipe composition without primitive visual defaults.

Core owns full coverage of these behavioral dimensions. React and Solid
adapters cover only their adaptation concerns plus one interaction wiring
round-trip per primitive; registry recipes cover only their smoke expectations.
Neither adapter nor registry surfaces re-prove the Core behavior matrix.

A primitive change is not complete until it passes every applicable surface,
packed exports are proven, registry consumers are green, and any changed
architectural decision is recorded.

## Contract evidence

The shipped primitives establish these precedents:

- Checkbox proves primitive-owned toggle state, Root activation, a
  retained state-reflecting Indicator, equivalent activation paths, and
  editable glyph ownership. Its boolean change callback does not expose cause
  details because no Checkbox behavior depends on cause.
- RadioGroup proves dynamic collection registration, retained Radio identity,
  rendered-order navigation, disabled and unavailable skipping, roving focus,
  and Radio-local state. Actual focus remains owned by RadioRootRenderable.
- Input proves that preserving OpenTUI-native mutable state is more important
  than forcing controlled/uncontrolled symmetry.
- Dialog proves renderer-scoped portals, topmost layer arbitration, cancellable
  dismissal, nested stacking, focus containment and restoration, and cleanup.
  Companion manager and async APIs remain outside the primitive contract.
- Toggle proves one single-part control can own standalone pressed state or
  adopt explicit ToggleGroup selection without changing its public component
  identity. ToggleGroup proves array-valued single/multiple selection and
  roving focus that does not imply selection.

Shared infrastructure may be extracted from these implementations only when
another vertical primitive demonstrates genuine reuse. The contract does not
require speculative universal toggle, collection, focus, or overlay engines.
