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
<CheckboxPrimitive.Root defaultChecked>
  <box width={1}>
    <CheckboxPrimitive.Indicator>
      <text content="✓" />
    </CheckboxPrimitive.Indicator>
  </box>
  <text content="Enable notifications" />
</CheckboxPrimitive.Root>
```

The primitive owns checked state and activation. The caller owns the check
glyph, label, layout, and appearance.

## Checkbox Tracer

Checkbox is the first vertical proof of this architecture:

- `CheckboxStore` is the framework-neutral state seam.
- `CheckboxRootRenderable` owns focus and activation.
- `CheckboxIndicatorRenderable` reflects shared state without choosing content.
- React and Solid expose matching `CheckboxPrimitive.Root` and
  `CheckboxPrimitive.Indicator` parts.
- The example recipes choose a mark, label, spacing, and colors in editable
  source.

Reference implementations:

- `packages/core/src/checkbox/primitive.ts`
- `packages/react/src/checkbox/primitive.ts`
- `packages/solid/src/checkbox/primitive.ts`
- `registry/checkbox/core.ts`
- `registry/checkbox/react.tsx`
- `registry/checkbox/solid.tsx`

This tracer intentionally coexists with the current packaged `Checkbox` recipe.
The remaining components should not migrate until this seam has been evaluated
through usage, tests, and review.

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
