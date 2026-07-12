# OpenTUI UI Roadmap

## Mission

Become the most trusted and widely consumed primitive package ecosystem built
on OpenTUI.

OpenTUI UI packages difficult, reusable interaction behavior and distributes
polished, consumer-owned recipes separately.

> Package the difficult behavior. Copy the opinionated layer.

## Product Layers

```text
OpenTUI renderer
  -> framework-neutral OpenTUI UI primitives
  -> React and Solid compound-part adapters
  -> editable recipes, themes, and blocks
  -> application-owned component libraries
```

### Packaged Primitives

The versioned packages own state machines, keyboard and pointer interaction,
focus, collections, overlays, disabled/read-only behavior, lifecycle, public
parts, public state, events, and imperative actions. They remain visually
unstyled and preserve native OpenTUI behavior where it already exists.

### Consumer-Owned Recipes

Registry recipes assemble primitive parts and choose glyphs, layout, colors,
themes, semantic variants, and convenience props. The installed source belongs
to the application and can be edited without wrapping opaque package code.

### Optional Styling

`@opentui-ui/styles` is an optional recipe and design-system tool. Primitive
behavior cannot depend on it.

## Ecosystem Position

OpenTUI UI focuses first on a tested, framework-neutral primitive substrate
that application teams, design systems, and community registries can consume.
React remains first-class; Solid and imperative Core usage share the same
packaged behavior rather than separate state machines.

## Delivery Phases

### Phase 0 - Architecture Proof

Status: complete, pending product evaluation.

- Base UI and shadcn responsibilities audited.
- Registry-first distribution and packaged primitive responsibilities audited.
- Checkbox proves a shared Core store, public Root/Indicator parts, React/Solid
  adapters, public state, lifecycle, and editable recipes.

### Phase 1 - Registry And Interaction Tracers

- Prove Checkbox installation through the shadcn registry path without freezing
  its tracer-only interface.
- RadioGroup proves collection registration, coordinated selection, disabled
  item skipping, and roving focus.
- Dialog proves triggers, portals, focus containment/restoration, Escape,
  dismissal, stacking, and nesting in foundation Core/React/Solid packages;
  the dedicated Dialog package remains a temporary compatibility/convenience
  package to rebuild on or shim those primitives. Toast still requires separate
  evidence before any equivalent move.
- Input proves strict preservation of OpenTUI-native editing and events.

No broad component migration begins until these tracers validate the shared
primitive contract.

### Phase 2 - Primitive Contract

Status: complete.

- Freeze the vocabulary for Root, parts, state, events, actions, and recipes.
- Establish Core, React, Solid, registry, clean-consumer, and terminal
  interaction conformance seams.
- Decide the supported part replacement/composition interface.
- Define focus, collection, overlay, and event-detail infrastructure through
  vertical primitives rather than speculative horizontal frameworks.

The frozen contract is documented in `FOUNDATION_PRIMITIVE_CONTRACT.md`.

### Phase 3 - Foundation Expansion

- Harden Checkbox against the validated contract.
- Derive Switch from the shared toggle behavior where appropriate.
- Provide Button activation behavior without fixed label or appearance.
- Decide the standalone Radio surface relative to RadioGroup Item parts.
- Treat Badge as a recipe rather than an interaction primitive.
- Add primitives alongside legacy packaged components, migrate recipes and
  consumers in green batches, then remove the legacy forms.

### Phase 4 - Registry Product

- Adopt the shadcn registry schema and CLI before building proprietary tooling.
- Install framework-appropriate React and Solid recipes.
- Add themes, symbols, semantic variants, examples, and application blocks.
- Make registry output strict-TypeScript clean and editable without hidden
  generation state.
- Define recipe revision discovery, compatibility, diff, and update guidance
  without overwriting consumer modifications.

### Phase 5 - Compatibility And Contraction

- Publish a compatibility/deprecation release with both legacy and primitive
  interfaces before removing published legacy exports.
- Contract legacy interfaces in independently green component batches.
- Remove shared hybrid infrastructure only after all component batches pass.

### Phase 6 - Ecosystem Release

- Publish stable primitive packages with packed and registry consumer evidence.
- Publish a coherent starter recipe set rather than maximizing component count.
- Document primitive authoring, recipe authoring, migration, and compatibility.
- Invite downstream registries to consume the primitive packages.

## Release Principle

Foundation v1 is gated by behavioral depth, composition, conformance evidence,
and a working consumer-owned recipe path. Styling breadth alone is not a v1
readiness signal.

The executable migration plan lives in
`.scratch/opentui-primitives-v1/spec.md` and its local issue files.
