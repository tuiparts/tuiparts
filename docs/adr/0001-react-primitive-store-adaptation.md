---
status: accepted
---

# Use Core Stores for React early state without consumer wiring

OpenTUI UI exposes Base UI-style primitive modules to React and Solid consumers,
while Core owns framework-neutral behavior. React automatically creates a Core
Store before the OpenTUI reconciler constructs the corresponding Renderable.
The later Root uses that exact Store. Consumers configure Root props and do not
wire Stores through framework components.

## Context

The public product direction is:

```text
@opentui-ui/core behavior
  -> React and Solid primitive modules
  -> consumer-owned shadcn-compatible recipes
```

Consumers must be able to build directly on the primitive packages without
installing a registry recipe. The framework interface therefore needs public
parts, controlled props, semantic callbacks, readonly state callbacks, native
OpenTUI properties, actions, and Renderable refs.

React introduces one ordering constraint. Function components evaluate
state-dependent children before the OpenTUI React reconciler constructs the
Root Renderable. Checkbox, Switch, and Button must still provide authoritative
initial state during that render, and passive parts need the same owner before
their host instances are constructed.

Solid has no equivalent constraint. Its adapter constructs the actual Core
Root synchronously and can provide that Renderable through context.

## Decision

### Framework primitives use module namespaces

Compound React and Solid primitives follow the Base UI module-namespace shape:

```ts
import { Checkbox as CheckboxPrimitive } from "@opentui-ui/react/checkbox";

function Checkbox(props: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root {...props}>
      <CheckboxPrimitive.Indicator>
        <text content="✓" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
```

The compound type surface is part-scoped:

```text
Checkbox.Root.Props                 Checkbox.Root.State
Checkbox.Indicator.Props
Switch.Root.Props                   Switch.Root.State
Switch.Thumb.Props
RadioGroup.Props                    RadioGroup.State
RadioGroup.ChangeDetails            RadioGroup.ValueChangeHandler
Radio.Root.Props                     Radio.Root.State
Radio.Indicator.Props
Dialog.Root.Props                   Dialog.Root.State
Dialog.Root.OpenChangeDetails       Dialog.Root.OpenChangeReason
Dialog.Trigger.Props                Dialog.Portal.Props
Dialog.Backdrop.Props               Dialog.Popup.Props
Dialog.Title.Props                  Dialog.Description.Props
Dialog.Close.Props
```

Single-part primitives remain callable function namespaces:

```text
Button.Props   Button.State   Button.PressDetails
Input.Props
```

Radio always receives collection ownership from RadioGroup, including a
one-choice composition; see ADR 0002.

The former flat framework type aliases are removed because the project is
pre-release. Registry recipes alias package primitives locally as
`CheckboxPrimitive`, `SwitchPrimitive`, and similar names.

### Core Stores are real low-level composition APIs

Core exports `ButtonStore`, `CheckboxStore`, and `SwitchStore`. Their Root
Renderable options accept an existing Store, and the Renderable exposes the
same Store through its `store` property. This makes the Core API coherent for
imperative callers rather than publishing an object that cannot be attached.

```ts
const store = new CheckboxStore({ defaultChecked: true });
const root = new CheckboxRootRenderable(renderer, { store });
const indicator = new CheckboxIndicatorRenderable(renderer, { store });
```

When a Store is supplied, it owns behavior state. Explicit Root behavior props
such as `checked`, `disabled`, and callbacks are applied to that Store;
`defaultChecked` is only used when Root creates its own Store. A mounted Root's
Store cannot be replaced.

The Stores are exported from Core only. React and Solid do not export Store
constructors or accept `store` in their public Props. A framework consumer uses
controlled props and callbacks instead.

### React creates the Store automatically

React creates one Core Store during the Root component's first render. The same
object supplies the external-store snapshot, context, passive parts, and the
later Core Root:

```text
React Root component
  -> creates Core Store in a ref
  -> reads its immutable snapshot with useSyncExternalStore
  -> evaluates state children
  -> provides Store through private framework context
  -> passes Store as a host-constructor property
  -> OpenTUI constructs Core Root with that exact Store
```

There is no bootstrap bridge, state-owner handoff, second package, private Core
subpath, or dependency on module singleton identity. JavaScript prop spreading
copies the Store reference, not the Store. Core does not use `instanceof` to
adopt it.

State callbacks always receive the immutable Store snapshot returned by
`useSyncExternalStore`. React adapters must not derive a second state object
from current props. Controlled props are applied to the same Store by the Core
Root during host commit; the Store synchronously notifies React, and OpenTUI
must not produce a terminal frame before that external-store update settles.
Frame-recording tests enforce this ordering.

Passive parts consume their Store directly. They must not claim to require a
Root when their actual dependency is only shared state, and framework adapters
must not subclass Core parts merely to translate Store ownership into a fake
Root:

```text
React private context -> Store -> Core Indicator or Thumb
```

React therefore registers the Core passive-part Renderable itself. There is no
adapter subclass, structural cast, or second state-owner abstraction.

The same rule applies to behavior-owning parts such as RadioGroup Root and
Item: Core provides same-instance Store setters where the reconciler must
reapply constructor props. React must not subclass a Core Renderable merely to
make that assignment legal. Mounted-instance context remains appropriate when
the actual dependency is part-local identity or lifecycle state, such as a
RadioGroup Item or Dialog Popup.

### Solid subscribes to the Root or justified Store

Solid constructs the actual Core Renderable synchronously. A private
`createRenderableState()` helper adapts Core subscriptions with Solid's
`from()`. State callbacks receive a stable readonly object whose property
getters read that accessor, which preserves Solid fine-grained reactivity
without repeated component-level `setState` calls.

```text
Solid Root component
  -> constructs Core Root Renderable
  -> adapts Root subscription with createRenderableState()
  -> provides actual Root through context
  -> evaluates state children
```

RadioGroup and Dialog use the same helper with their Stores because those
Stores coordinate multiple Renderables and renderer-root ownership.

### Consumers normally do not know about Stores

Registry consumers use installed recipes. Primitive builders compose Root and
parts and use controlled props when necessary. Neither group constructs or
passes a Store:

```tsx
<CheckboxPrimitive.Root
  checked={checked}
  onCheckedChange={setChecked}
>
  {(state) => /* consumer-owned presentation */}
</CheckboxPrimitive.Root>
```

Themeability belongs to consumer-owned recipes through recipe props, tokens,
context, symbol sets, density, and state-driven presentation. Stores do not
carry visual policy.

## Consistency invariants

1. State-dependent React children, Root, Indicator, and Thumb use the same
   Store instance from the first render through teardown.
2. Initial controlled and uncontrolled state requires no effect, ref callback,
   or post-commit handoff.
3. Controlled props commit through the Store before OpenTUI produces a frame,
   while Core remains responsible for transitions and callbacks.
4. No terminal frame may contain conflicting Root and passive-part states.
5. Root and retained-part identities do not change across state updates.
6. Store, React, and passive-part subscriptions are removed exactly once.
7. Published React and Solid Props contain no `store` property.

Tests must inspect initial state, every interaction frame, controlled updates,
controlled-to-uncontrolled transitions, disablement, focus, retained identity,
and Store identity. Waiting only for eventual state is insufficient.

## Considered options

### Require consumers to wire Stores

Rejected as the default framework interface. It exposes construction,
precedence, reuse, and lifecycle choices that registry users and primitive
builders do not need. Framework Roots create Stores automatically.

### Hide Stores in another workspace package

Rejected. It kept the framework surface small but introduced another package,
build boundary, and maintenance unit for objects that are already coherent
Core composition APIs.

### Import unexported Core source from React

Rejected. Although bundling could erase the source import, it creates an
implicit cross-package build dependency and requires tarball checks to prove
that source paths never escape. Public attachable Core Stores are simpler.

### Export unsupported `_internal` Core subpaths

Rejected. Exported subpaths are importable and discoverable regardless of
their name. The former `_internal` entries are removed without deprecated
aliases.

### Bootstrap state and attach to the later Root

Rejected. A bridge duplicates initialization rules, temporarily owns state,
and creates a synchronization boundary where React could observe different
owners.

### Construct mutable Renderables during React render

Rejected under the current OpenTUI React interface. Strict Mode replays,
suspension, or abandoned concurrent work could leak Renderables because the
reconciler has no lifecycle-safe adoption facility.

### Reimplement Core behavior with hooks

Rejected. React would become a second behavior owner and could diverge from
Core and Solid semantics.

### Project current props over the Store snapshot

Rejected. Although this can make a controlled prop appear current during the
pre-commit React render, Root content would read a derived object while passive
parts still read the Store. It duplicates Core rules such as disabled-focus
resolution and creates two simultaneous state views. If frame consistency
fails, the Store/reconciler integration must be fixed instead.

## Bundling and executable requirements

The implementation uses ordinary exports from `@opentui-ui/core`; there is no
private runtime dependency. Packed-package validation must still verify:

- no `_internal`, `primitive-runtime`, or cross-package source import remains;
- declarations expose framework namespace types but no framework `store` prop;
- Core Store exports and Root attachment types are usable;
- installed tarballs type-check and run in isolated consumers;
- a minimal Bun single-file executable can mount and interact with a primitive.

Multiple copies of the Store class do not affect a mounted primitive because
the live Store object is passed directly and Core does not rely on nominal
identity. Mixing Root and parts from different physical copies of the React
package can still split React context, as with any context-based library, and
is unsupported.

## Removal path

Automatic React Store creation can disappear without a consumer migration if
OpenTUI React eventually provides a lifecycle-safe way to obtain or adopt the
actual Root before children and passive parts are evaluated. That facility
must work under Strict Mode, suspension, abandoned work, and concurrent
rendering; provide immutable snapshots and synchronous subscriptions; and own
disposal exactly once.

At that point React can subscribe directly to Root, place Root in context, and
stop creating a Store before host construction. The public module namespaces,
Core Store API, registry recipes, controlled props, and state callbacks remain
unchanged.
