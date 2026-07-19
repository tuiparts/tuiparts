# tuiparts.sh Primitives And Recipes

## Direction

tuiparts.sh separates difficult packaged behavior from opinionated,
consumer-owned presentation.

This is the formal product architecture for the v1 primitive contract.
`PRIMITIVE_CONTRACT.md` defines the public vocabulary, ownership,
composition, adapter, lifecycle, and conformance rules that primitive
implementations must follow.

```text
@opentui/core
  -> @tuiparts/core framework-neutral primitives
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

Recipes express variants and state-dependent presentation with ordinary
TypeScript and native OpenTUI properties. The project does not impose a
styling engine on application or registry authors.

## Parts Versus Style Slots

A part is a public node that consumers can render, omit when optional, reorder
within its structural constraints, wrap, reference, and compose. A style slot
only changes a private node's properties. Primitives require parts; recipes may
additionally expose style slots for convenient whole-component customization.
The v1 primitive contract deliberately supports explicit parts, children,
state callbacks, native OpenTUI properties, and Renderable refs rather than a
Base UI-style `render`, `asChild`, or polymorphic replacement seam.

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

## Checkbox primitive

Checkbox follows the primitive contract:

- `CheckboxRootRenderable` owns state, subscriptions, focus, and activation.
- `CheckboxIndicatorRenderable` reflects shared state without choosing content.
- React and Solid expose matching `Checkbox.Root` and
  `Checkbox.Indicator` parts.
- The example recipes choose a mark, label, spacing, and colors in editable
  source.
- Core callers pass the owning Root to Indicator; React and Solid hide that
  owner wiring through Root context.
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

`Checkbox` is the canonical React and Solid primitive export. Editable starter
recipes reserve one terminal cell for `mark`; applications that need a wide
mark own the corresponding recipe layout change.

## Switch primitive

Switch follows the same frozen ownership and activation rules without treating
its Thumb like Checkbox's conditional Indicator:

- `SwitchRootRenderable` owns checked, disabled, and focused state plus the
  shared `press()`, Enter, Space, and
  uncancelled primary-button release request.
- `SwitchThumbRenderable` is an always-mounted public part that exposes the
  shared readonly state while recipes choose its position and appearance.
- React and Solid expose matching `Switch.Root` and
  `Switch.Thumb` parts, readonly state callbacks, and Renderable refs.
- Editable Core, React, and Solid recipes own track and thumb glyphs, track
  width, density, spacing, positioning, colors, and labels.

Checkbox and Switch use component-specific, attachable Core Stores. React
creates those Stores automatically, while framework consumers configure Roots
through props and callbacks. The Stores share no generic public toggle base
class.

Reference implementations:

- `packages/core/src/switch/primitive.ts`
- `packages/react/src/switch/primitive.ts`
- `packages/solid/src/switch/primitive.ts`
- `registry/switch/core.ts`
- `registry/switch/react.tsx`
- `registry/switch/solid.tsx`

## Button primitive

Button packages activation without imposing a label or visual child tree:

- `ButtonRenderable` owns readonly disabled, focused, and pressed state plus
  imperative, keyboard, and
  primary-pointer activation.
- `ButtonPressDetails` distinguishes imperative, keyboard, and pointer sources
  with a small immutable terminal vocabulary.
- Pressed state is cleared by cancelled pointer release, disablement, blur, and
  teardown.
- React and Solid expose the same single-part `Button`, state callback, native
  properties, and Renderable ref.
- Editable recipes choose the label, padding, colors, intent, and size.

Button needs no public parts namespace: arbitrary content inside Button is the
composition seam, and adding a Label part would package presentation without
adding behavior.

Reference implementations:

- `packages/core/src/button/primitive.ts`
- `packages/react/src/button/button.tsx`
- `packages/solid/src/button/button.tsx`
- `registry/button/core.ts`
- `registry/button/react.tsx`
- `registry/button/solid.tsx`

## Toggle and ToggleGroup primitives

Toggle is a single-part two-state button. It does not invent a `Root` or
`Indicator`: arbitrary children and the readonly state callback are its
presentation seam.

- Standalone Toggle owns controlled or uncontrolled `pressed` state.
- A Toggle inside ToggleGroup requires a unique `value` and adopts the
  group's array-valued selection.
- ToggleGroup supports single and multiple selection. Single selection may be
  empty when the active Toggle is pressed again.
- Arrow keys follow group orientation and Home/End move roving focus without
  changing selection.
- Enter, Return, Space, primary pointer release, and `press()` activate Toggle
  through the same immutable terminal change details.
- React creates the same Core Toggle Store used by the later Renderable, so
  grouped pressed state is authoritative during the first render. Solid
  constructs the retained Core Renderable directly.
- Editable recipes own labels, density, layout, and colors. Their
  `ToggleGroupItem` name is convenience presentation over the same Toggle
  primitive, not another packaged component.

Reference implementations:

- `packages/core/src/toggle/primitive.ts`
- `packages/core/src/toggle-group/primitive.ts`
- `packages/react/src/toggle/primitive.ts`
- `packages/react/src/toggle-group/primitive.ts`
- `packages/solid/src/toggle/primitive.ts`
- `packages/solid/src/toggle-group/primitive.ts`
- `registry/toggle/`
- `registry/toggle-group/`

See ADR-0005 for why Toggle may optionally adopt group ownership while Radio
always requires RadioGroup.

Conformance evidence:

| Surface | Evidence |
| --- | --- |
| Core | Toggle and ToggleGroup public Renderable tests cover ownership, activation details, disabled and unavailable requests, single/multiple selection, callback ordering, orientation, roving focus, Store attachment, and teardown-sensitive collection behavior. |
| React | Real `testRender` coverage proves initial state, controlled updates, prop removal, callback replacement, actual refs, retained Renderable identity, and grouped interaction. |
| Solid | The React adapter matrix is repeated through Solid signals and actual Core Renderables, including grouped focus and selection. |
| Registry | Strict recipe TypeScript configs and installed runtime smokes cover Core, React, and Solid. |
| Packed | `scripts/validate-packages.mjs` verifies all six new package subpaths from built tarballs alongside the existing Publint and declaration checks. |
| Terminal | The runnable sequence below drives `examples/core` in a real pseudo-terminal and asserts rendered output. |

Terminal conformance sequence (run from `examples/core`, driven here with
[terminal-control](https://crates.io/crates/terminal-control); any PTY driver
works):

```bash
termctrl start tg --host opentui -- bun run src/toggle-group-primitive-demo.ts
termctrl wait tg "Core Toggle and ToggleGroup primitives"
termctrl send tg "text: "   # Space on the focused standalone Toggle
termctrl wait tg "Standalone: on (keyboard)"
termctrl send tg tab        # Tab reaches the group's single roving stop
termctrl send tg right      # focus moves Left -> Center; selection unchanged
termctrl send tg "text: "
termctrl wait tg "Alignment: center (keyboard)"
termctrl send tg end        # jump to Right
termctrl send tg right      # wraps to Left (default loopFocus)
termctrl send tg down       # off-axis key ignored in a horizontal group
termctrl send tg tab        # leave the group in one keystroke
termctrl send tg tab        # re-enter: the roving stop is retained, not reset
termctrl send tg right      # focus Center
termctrl send tg "text: "   # re-press deselects in single mode
termctrl wait tg "Alignment: none (keyboard)"
termctrl stop tg

termctrl start rg --host opentui -- bun run src/radio-group-primitive-demo.ts
termctrl wait rg "Owner value: compact"
termctrl send rg tab        # focusTabStop lands on checked Alpha
termctrl send rg down       # skips disabled Beta; navigation selects Gamma
termctrl send rg text:r     # removes Gamma; focus falls back to Delta
termctrl wait rg "Removed gamma; focus fell back to delta."
termctrl send rg tab
termctrl send rg down       # controlled group echoes the requested value
termctrl wait rg "Owner value: comfortable (navigation)"
termctrl stop rg
```

Every `wait` above is an assertion against the rendered terminal, and the
focus positions were additionally verified from rendered screenshots. This
sequence was last executed against the shared roving-collection engine
covering both ToggleGroup and RadioGroup.

## Textarea primitive

Textarea follows Input's OpenTUI-native ownership precedent for multiline
editing:

- `TextareaRenderable` retains OpenTUI's `EditBuffer`, `EditorView`, cursor,
  selection, undo history, paste handling, keybindings, and callback order.
- `initialValue` keeps its native initialize-once meaning. Applications use
  native editing methods rather than a controlled `value` or synthetic
  `defaultValue` owner.
- React and Solid expose the named single-part `Textarea`, reactive native
  props, and refs to the actual Core Renderable. There is no artificial Root,
  compound Part, or Store.
- Disabled gates focus, keyboard editing, paste, and submission while leaving
  programmatic EditBuffer operations native.
- Editable recipes own height, wrapping, and cursor, selection, placeholder,
  text, and focus colors.

Reference implementations:

- `packages/core/src/textarea/primitive.ts`
- `packages/react/src/textarea/primitive.ts`
- `packages/solid/src/textarea/primitive.ts`
- `registry/textarea/`

The focused public contract and conformance rationale are recorded in
`docs/primitive-contracts/textarea.md`.

## Badge Recipe

Badge has no reusable interaction, state, focus, keyboard, pointer, collection,
overlay, or lifecycle behavior. It is therefore not a primitive and has no
`@tuiparts/core`, React, or Solid package export.

Editable Core, React, and Solid Badge recipes are built directly from ordinary
OpenTUI Box and Text nodes. They own label assembly, intent palettes, size,
padding, and visual defaults while retaining native root properties and label
overrides for local customization.

Reference implementations:

- `registry/badge/core.ts`
- `registry/badge/react.tsx`
- `registry/badge/solid.tsx`

## Radio And RadioGroup

Radio behavior has one primitive model:

- `RadioGroup` owns the collection Store and controlled/uncontrolled
  value.
- `Radio.Root` owns focus and activation while registering checked,
  availability, disabled state, and roving focus with its RadioGroup.
- `Radio.Indicator` reflects its Radio's checked state without choosing a
  glyph.
- Radio always requires RadioGroup; it does not create conditional hidden
  ownership when rendered alone.
- A one-choice UI still composes one Radio inside RadioGroup. There is no
  standalone boolean API or hidden one-item wrapper.
- Checkbox or Switch is the appropriate primitive for a reversible boolean
  choice.

This keeps every Radio on the same parts, readonly state, change details,
semantic actions, and actual Renderable refs. See ADR 0002 for the ownership
decision and alternatives considered.

Reference implementations:

- `packages/core/src/radio/primitive.ts`
- `packages/react/src/radio/primitive.ts`
- `packages/solid/src/radio/primitive.ts`
- `registry/radio-group/core.ts`
- `registry/radio-group/react.tsx`
- `registry/radio-group/solid.tsx`

## Distribution

A shadcn-like OpenTUI experience requires a registry that copies
framework-specific recipes while depending on shared primitive packages.
Registry items describe source files, package and recipe dependencies, target
framework, compatible primitive versions, themes, and documentation.

The project uses the official shadcn registry schema and CLI. A proprietary
installer is out of scope until an evidenced incompatibility requires one.

## Companion package boundary

Primitive behavior belongs in `@tuiparts/core`, with matching
compound adapters in `@tuiparts/react` and `@tuiparts/solid`. Dialog is the
overlay evidence for that boundary: its store and coordinator live at the
Dialog primitive subpaths.

The already-adopted `@tuiparts/dialog` and `@tuiparts/toast` packages are
independently versioned companion products. Their existing manager, provider,
async, theme, and notification APIs remain supported on their current import
paths. Reconciling their internals with primitive behavior is separate work
and does not determine Core, React, Solid, or registry versions. A Dialog
recipe does not replace the Dialog companion, and no Toast primitive is
implied.
