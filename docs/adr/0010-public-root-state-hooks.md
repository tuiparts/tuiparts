---
status: accepted
---

# Framework primitives expose public Root state hooks

> **Agent entry point:** Read this ADR before threading a Primitive's public
> state through Recipe-local framework context, and before adding any new
> public state read surface to a React or Solid adapter.

## Context

Recipes and other composition-aware parts sometimes need a Root-owned public
fact — Tabs List layout follows the Root's `orientation` — outside the Part
that owns it. DOM component libraries get this channel for free: Base UI and
Radix project state onto the DOM as `data-*` attributes and CSS reads them,
so shadcn Recipes rarely thread state manually, and where CSS cannot express
it they accept a Recipe-local context with a silent default. A terminal UI
has no CSS or data-attribute channel; every state-dependent presentation must
flow through the framework layer.

The first Tabs Recipe used the shadcn idiom: a Recipe-local
`TabsOrientationContext` defaulting to `"horizontal"`. That created a second
source of truth. Composing the Recipe `TabsList` under a primitive
`Tabs.Root` — a composition the types permit — silently fell back to the
default, laying the List out horizontally while the Store drove vertical
keyboard navigation. The Core Recipe had no such split because it reads
`root.orientation` from the Store directly.

## Decision

Framework adapters expose the Primitive's public Root state through one
supplementary hook per Primitive, and Recipes read Root-owned facts from it
instead of mirroring them in framework state.

- The hook is named after the contract concept it returns: `useRootState()`
  returns the public frozen Root state snapshot, typed as the existing
  `Root.State`. Hooks follow the same generic, namespace-disambiguated naming
  as Parts; consumers call `Tabs.useRootState()`.
- The hook is orphan-safe, not silently defaulting: outside its Root it fails
  with the same part-specific error contract as orphan Parts
  (`Tabs.useRootState must be rendered inside Tabs.Root`).
- React implements the hook with `useSyncExternalStore` over the Store held
  in the adapter's existing context; the frozen, referentially stable
  snapshot contract makes returning `store.state` safe. Solid shares the
  Root's single reactive state object through context so the hook adds no
  second subscription; fine-grained getters keep tracking granular.
- Recipes must not introduce Recipe-local contexts that duplicate Primitive
  public state. A Recipe context remains appropriate only for Recipe-owned
  facts a Primitive does not carry.
- This is a supplementary read surface, not a hooks-first API: adapters still
  ship complete Parts, and a Primitive adds the hook only when a real
  composition consumer exists — no speculative selector overloads or
  additional state hooks ahead of need.
- Core needs no hook; Core callers read `store.state` or Renderable getters
  directly, and Core Recipes already do.

Tabs is the first Primitive to ship the hook; the Tabs Recipe's orientation
context is deleted in the same change.

## Consequences

- Recipe presentation and Primitive behavior read the same source of truth,
  so layout cannot desynchronize from keyboard orientation under primitive
  composition; misuse now fails loudly instead of silently defaulting.
- The React and Solid Recipe mechanism converges with Core's existing
  single-source read path across the contract's surface matrix.
- Each Primitive that gains a composition consumer adds one public API
  surface per adapter, documented in its contract and reference page and
  covered at the adapter test seam.
- Divergence from Base UI (render props and data attributes) and shadcn
  (Recipe-local contexts) is deliberate and recorded here: both rely on a DOM
  channel that terminals do not have.
