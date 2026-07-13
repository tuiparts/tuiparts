# OpenTUI UI Primitives And Recipes

## Direction

OpenTUI UI will separate difficult packaged behavior from opinionated,
consumer-owned presentation.

This is the formal product architecture for foundation v1. `ROADMAP.md`
defines the delivery phases, and `.scratch/opentui-primitives-v1/` contains the
local executable migration plan. `FOUNDATION_PRIMITIVE_CONTRACT.md` freezes the
public vocabulary, ownership, composition, adapter, lifecycle, and conformance
rules that primitive implementations must follow.

```text
@opentui/core
  -> @opentui-ui/core framework-neutral primitives
  -> React and Solid compound-part adapters
  -> editable recipes and blocks
```

The design rule is:

> Package the difficult behavior. Copy the opinionated layer.

## Primitive Layer

Primitives own reusable interaction contracts:

- State and controlled/uncontrolled behavior where the underlying OpenTUI
  control does not already define it.
- Keyboard and pointer interaction.
- Focus, disabled, read-only, collection, overlay, and lifecycle behavior.
- Public state, events, imperative actions, and independently composable parts.
- Framework-neutral behavior shared by React and Solid.

Primitives do not own colors, spacing, glyph sets, themes, semantic variants,
or a fixed visual child tree. Where OpenTUI already provides the behavior, as
with Input, the primitive preserves OpenTUI's contract rather than replacing
it.

## Recipe Layer

Recipes assemble primitives into useful defaults:

- Glyphs and content affordances.
- Layout, colors, spacing, and themes.
- Semantic variants and convenience props.
- Higher-level compositions and application blocks.
- Source files installed into and owned by the consumer's project.

The existing `@opentui-ui/styles` package can power recipes, but primitive
behavior must not depend on it.

## Parts Versus Style Slots

A part is a public node that consumers can render, omit when optional, reorder
within its structural constraints, wrap, reference, and compose. A style slot
only changes a private node's properties. Primitives require parts; recipes may
additionally expose style slots for convenient whole-component customization.
Foundation v1 deliberately supports explicit parts, children, state callbacks,
native OpenTUI properties, and Renderable refs rather than a Base UI-style
`render`, `asChild`, or polymorphic replacement seam.

For example, the Checkbox primitive is assembled explicitly:

```tsx
<Checkbox.Root defaultChecked>
  <box width={1}>
    <Checkbox.Indicator>
      <text content="✓" />
    </Checkbox.Indicator>
  </box>
  <text content="Enable notifications" />
</Checkbox.Root>
```

The primitive owns checked state and activation. The caller owns the check
glyph, label, layout, and appearance.

## Checkbox Foundation Primitive

Checkbox is the first primitive hardened against the foundation contract:

- `CheckboxStore` is the framework-neutral state seam.
- `CheckboxRootRenderable` owns focus and activation.
- `CheckboxIndicatorRenderable` reflects shared state without choosing content.
- React and Solid expose matching `Checkbox.Root` and
  `Checkbox.Indicator` parts.
- The example recipes choose a mark, label, spacing, and colors in editable
  source.
- Core callers either pass one Store explicitly or compose parts from
  `root.store`; React and Solid provide that Store through Root context.
- An authored Indicator remains mounted and reflects checked state through
  Renderable visibility in Core, React, and Solid. Recipes may omit the part
  entirely when they do not need a visual indicator.
- `press()`, Enter, Space, and an uncancelled primary-button release request the
  same boolean change. Checkbox does not expose input-source details because no
  Checkbox behavior currently depends on the activation source.
- Composition uses Root children, Indicator children, readonly state callbacks,
  and Renderable refs. It does not support arbitrary Root or Indicator
  replacement.

Reference implementations:

- `packages/core/src/checkbox/primitive.ts`
- `packages/react/src/checkbox/primitive.ts`
- `packages/solid/src/checkbox/primitive.ts`
- `registry/checkbox/core.ts`
- `registry/checkbox/react.tsx`
- `registry/checkbox/solid.tsx`

`Checkbox` is now the canonical React and Solid foundation export. The old
packaged fixed-tree Checkbox is no longer exported; its shared styled
infrastructure remains private until the remaining component migrations allow
the final contraction. Editable starter recipes reserve one terminal cell for
`mark`; applications that need a wide mark own the corresponding recipe layout
change.

## Switch Foundation Primitive

Switch follows the same frozen ownership and activation rules without treating
its Thumb like Checkbox's conditional Indicator:

- `SwitchStore` owns framework-neutral checked, disabled, and focused state.
- `SwitchRootRenderable` owns focus and the shared `press()`, Enter, Space, and
  uncancelled primary-button release request.
- `SwitchThumbRenderable` is an always-mounted public part that exposes the
  shared readonly state while recipes choose its position and appearance.
- React and Solid expose matching `Switch.Root` and
  `Switch.Thumb` parts, readonly state callbacks, and Renderable refs.
- Editable Core, React, and Solid recipes own track and thumb glyphs, track
  width, density, spacing, positioning, colors, and labels.

Checkbox and Switch retain component-specific stores. Their current behavior
is small and equivalent in several places, but extracting a generic toggle
module would add an abstraction without yet removing enough duplication to
justify flattening their distinct Indicator and Thumb lifecycle semantics.

Reference implementations:

- `packages/core/src/switch/primitive.ts`
- `packages/react/src/switch/primitive.ts`
- `packages/solid/src/switch/primitive.ts`
- `registry/switch/core.ts`
- `registry/switch/react.tsx`
- `registry/switch/solid.tsx`

## Button Foundation Primitive

Button packages activation without imposing a label or visual child tree:

- `ButtonStore` owns readonly disabled, focused, and pressed state.
- `ButtonRootRenderable` owns focus plus imperative, keyboard, and
  primary-pointer activation.
- `ButtonPressDetails` distinguishes imperative, keyboard, and pointer sources
  with a small immutable terminal vocabulary.
- Pressed state is cleared by cancelled pointer release, disablement, blur, and
  teardown.
- React and Solid expose the same `Button.Root`, state callback, native
  properties, and Renderable ref.
- Editable recipes choose the label, padding, colors, intent, and size.

Button needs no additional public parts: arbitrary content inside Root is the
composition seam, and adding a Label part would package presentation without
adding behavior.

Reference implementations:

- `packages/core/src/button/primitive.ts`
- `packages/react/src/button/button.tsx`
- `packages/solid/src/button/button.tsx`
- `registry/button/core.ts`
- `registry/button/react.tsx`
- `registry/button/solid.tsx`

## Distribution

A shadcn-like OpenTUI experience requires a registry that copies
framework-specific recipes while depending on shared primitive packages.
Registry items describe source files, package and recipe dependencies, target
framework, compatible primitive versions, themes, and documentation.

The project will first adopt the official shadcn registry schema and CLI. A
proprietary installer is out of scope until an evidenced incompatibility
requires one.

## Companion Package Boundary

Foundation primitive behavior belongs in `@opentui-ui/core`, with matching
compound adapters in `@opentui-ui/react` and `@opentui-ui/solid`. Dialog is the
overlay evidence for that boundary: its store and coordinator live at the
foundation Dialog subpaths, while `@opentui-ui/dialog` remains a temporary
compatibility/convenience package for its production manager, providers, and
async APIs until it can be rebuilt on or explicitly shim the primitive.

Toast has not moved. `@opentui-ui/toast` is likewise a temporary
compatibility/convenience package candidate, but its foundation destination
requires separate evidence and must not be inferred from the Dialog move.
