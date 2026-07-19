---
status: accepted
---

# Deliver Primitives and Recipes as complete verticals

> **Agent entry point:** Read this ADR before creating or materially changing
> a Primitive or Recipe. A change is incomplete until every applicable surface
> and validation gate below is satisfied.

## Context

A tuiparts.sh Catalog entry crosses several independently consumable surfaces:
framework-neutral behavior, React and Solid adaptation, consumer-owned Recipe
source, Registry metadata, package exports, documentation, clean-consumer
validation, and release metadata. Completing only the visible implementation
can leave missing subpath exports, divergent adapters, unverified installed
source, or behavior tests duplicated at every layer.

The repository already defines the behavior contract in
`PRIMITIVE_CONTRACT.md` and the product boundary in
`PRIMITIVES_AND_RECIPES.md`. This ADR makes their delivery workflow binding. It
does not replace either document.

## Decision

Every new Primitive or Recipe is delivered as one complete vertical. Work
starts by choosing the correct product layer, records the intended public
contract, implements only the behavior owned by each seam, and finishes with
the full applicable validation and release evidence.

### 1. Choose the layer before designing the interface

Create a **Primitive** only when it packages difficult, reusable terminal
behavior: state ownership, keyboard or pointer interaction, focus, collection
coordination, overlays, disabled behavior, lifecycle, or semantic actions.
Deleting it should force that complexity back into multiple callers.

Create a **Recipe** when the value is editable presentation or composition:
layout, content, glyphs, colors, density, variants, convenience props, or a
small amount of locally understandable state. A Recipe may compose existing
Primitives and native OpenTUI Renderables. It must not recreate behavior that
belongs to a packaged Primitive.

When OpenTUI already owns a control's difficult behavior, preserve its native
state and event model. Use a named single-part adapter when there is no honest
composition value. Do not project compound Parts onto a fixed internal tree;
every public Part must be a real Renderable with behavior or semantic
responsibility.

Before implementation, write down:

- The behavior owner: tuiparts Core, OpenTUI, or the consuming application.
- The proposed Root and Parts, or why the Primitive is single-part.
- Controlled, uncontrolled, or OpenTUI-native state ownership.
- Semantic callbacks, details, actions, refs, and conditional mounting.
- Keyboard, pointer, focus, disabled, unavailable, lifecycle, and teardown
  behavior that applies.
- The applicable `PRIMITIVE_CONTRACT.md` conformance rows; every `N/A` needs a
  reason.

If the work changes a lasting public interface, ownership rule, package seam,
adapter state flow, or shared implementation policy, update or supersede the
relevant ADR before treating the implementation as complete. Routine vertical
delivery under existing decisions does not require another ADR.

### 2. Follow repository standards and existing decisions

Read the root and nearest nested `AGENTS.md`, `PRIMITIVE_CONTRACT.md`,
`PRIMITIVES_AND_RECIPES.md`, the accepted ADR index and every accepted ADR,
and the closest existing vertical before adding code. Apply
`.agents/skills/coding-standards/SKILL.md` to new and refactored TypeScript.

In particular:

- Core remains the single behavior owner. React and Solid adapt Core; they do
  not implement parallel state machines.
- Prefer composition and an existing proven internal seam when its lifecycle
  and semantics genuinely match. Do not create a universal abstraction for
  one speculative caller.
- Preserve actual Core Renderable identity across reactive updates and expose
  actual Renderables through refs.
- Keep public snapshots readonly, immutable, and referentially stable until
  observable state changes.
- Use explicit type-only imports, strict types, and JSDoc for exported symbols.
- Avoid `any`, non-null assertions, and unjustified casts. Any necessary
  interop cast follows the repository's safety-comment rule.
- Keep colors, spacing, dimensions, glyphs, labels, themes, variants, and
  opinionated visual assembly out of Primitive packages.

### 3. Complete every Primitive surface

#### Core

- Add the Primitive under `packages/core/src/<name>/` with its public
  Renderables, Store when coordination justifies one, types, and local
  `index.ts`.
- Export the public interface from `packages/core/src/index.ts` and the package
  subpath from both development and `publishConfig` export maps.
- Add the subpath entry to `packages/core/tsdown.config.ts`.
- Reuse shared pressable, checked-state, collection, or overlay implementation
  only when the accepted ADR and actual semantics allow it.
- Keep internal helpers private unless a coherent Core composition workflow
  requires a public interface.

#### React and Solid

- Add equivalent public names, Parts, Props, State, callbacks, actions, and
  Renderable ref targets in both adapters.
- Adapt the same Core owner. React follows ADR-0001 for authoritative early
  Store state; Solid constructs and reactively updates retained Core
  Renderables through its established helpers.
- Fail clearly when a Part is used without its required owner.
- Update each adapter's source exports, development and publish export maps,
  `sideEffects` entries where registration is performed, and tsdown entries.
- Never subclass a Core Part merely to make prop assignment or Store context
  convenient when a same-instance setter or direct Store dependency is the
  truthful seam.

#### Recipe and Registry

- Add Core, React, and Solid Recipe source under `registry/<name>/`, with
  matching exported vocabulary where runtime semantics permit.
- Import packaged behavior through public component-specific subpaths. Do not
  reach into package source or private fields.
- Keep presentation and convenience props in the installed source. Read
  presentation tokens from the consumer-owned theme Recipe.
- Add Registry items for each supported runtime with accurate direct package
  dependencies, theme `registryDependencies`, consumer ownership metadata,
  and shadcn diff update strategy.
- Add the Recipe to the structural lists in `scripts/validate-registry.mjs`,
  including its correct Primitive-backed or Recipe-only classification.
- Add a focused README and one Registry smoke per supported runtime.

#### Packaging and documentation

- Add every new published subpath to the entrypoint matrix in
  `scripts/validate-packages.mjs` so declarations and runtime imports are
  tested from packed tarballs.
- Add a release changeset for publishable behavior or public-interface
  changes. A new Primitive includes all three linked Foundation packages:
  `@tuiparts/core`, `@tuiparts/react`, and `@tuiparts/solid`.
- Update package inventories and architecture/reference documentation affected
  by the new public surface.
- Add the Catalog page for Recipe usage, customization, behavior summary, and
  Recipe-only interface. Add or update the Primitive reference page for
  packaged behavior, composition, Parts, and package interface. Do not scatter
  raw Primitive composition across Catalog pages.
- Run `pnpm docs:build` when documentation-site content or navigation changes.

### 4. Keep tests at their owning seam

The test pyramid is mandatory:

| Seam | Owns |
| --- | --- |
| Shared Core internal module | A behavior matrix shared by multiple Primitive implementations, such as press gesture guards. |
| Primitive Core tests | Public ownership, state, requests, event details, keyboard, pointer, focus, disabled and unavailable behavior, lifecycle, dynamic registration, teardown, and recipe-compatible composition. |
| React adapter tests | First-render authoritative state, controlled frame consistency, prop application and removal, callback replacement, actual refs, retained Renderable and Store identity, Strict Mode, context errors, and subscription teardown. |
| Solid adapter tests | Reactive getters and cleanup, prop application and removal, actual refs, retained Renderable and Store identity, context errors, and subscription teardown. |
| Registry smoke tests | Installation-facing mount, one prop or state round-trip, Recipe-owned presentation, and theme restyle. |
| Packed-package validation | Published declarations, peer installation, every subpath import, runtime import, and representative executable behavior. |
| Terminal sequence | User-visible ordering, focus, pointer, dismissal, or restoration that lower seams cannot prove end to end. |

Core owns behavior semantics. React and Solid each keep exactly one interaction
round-trip per Primitive as wiring proof; they do not repeat Core's keyboard,
pointer, disabled, controlled-state, or collection matrices. Registry smokes
do not repeat either Core behavior or framework adaptation suites.

A framework-specific behavior belongs in that framework's adapter suite. A
behavior test removed from an adapter or Registry smoke must already have an
equivalent Core owner; reducing duplication must never reduce coverage.

### 5. Validate the delivered vertical

Use focused commands while iterating, then run the complete gate before
handoff. Typical focused commands are:

```bash
pnpm --filter @tuiparts/core test
pnpm --filter @tuiparts/react test
pnpm --filter @tuiparts/solid test
pnpm validate:registry --recipe=<name>
```

The required final command for a Primitive or Registry Recipe is:

```bash
pnpm validate:foundation
```

That gate runs lint, typechecking, all tests, the build, packed-package
validation, exhaustive Registry consumer validation, and Foundation release
scope validation. Do not substitute workspace source imports for packed or
installed-consumer evidence.

If `apps/www` changed, also run:

```bash
pnpm docs:build
```

### 6. Use one completion definition

A Primitive is complete only when its Core behavior, React and Solid adapters,
Recipe source, Registry entries, correctly scoped tests, package subpaths,
packed-consumer checks, documentation, and release changeset are complete.

A Recipe-only addition is complete only when its Core, React, and Solid source
where applicable, Registry metadata, installed-consumer smokes, documentation,
and full validation are complete. It does not add a behaviorless Foundation
export merely to make the Catalog inventory symmetrical.

## Consequences

- Users do not encounter partially exported or differently behaving runtime
  implementations.
- Behavior fixes remain local to Core, while adapter and Registry suites stay
  fast and diagnostic instead of duplicating the same matrix.
- Registry source remains independently installable, editable, and verified
  against packed packages rather than workspace accidents.
- Agents have one discoverable delivery checklist, while the Primitive
  Contract remains the canonical behavioral specification.
- A new Primitive is deliberately more work than a Recipe because its
  versioned behavior contract must be correct across every supported seam.
