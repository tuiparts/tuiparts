# Accordion Recipe

These files are the consumer-owned presentation layer for Accordion. The root
`registry.json` exposes separate `core/accordion`, `react/accordion`, and
`solid/accordion` items. Installation copies editable source into
`components/ui`; coordinated expansion and interaction remain in the packaged
Accordion Primitive.

- `react.tsx` is the editable React Recipe.
- `solid.tsx` is the equivalent Solid Recipe.
- `core.ts` is the imperative Recipe.

Each Recipe chooses vertical Item layout, disclosure markers, spacing, colors,
content indentation, and the labeled Trigger convenience interface. The
packaged Primitive owns controlled and uncontrolled values, single or multiple
expansion, effective disablement, focus, activation, and Panel lifecycle.

From the workspace root, `pnpm validate:registry --recipe=accordion` installs
all three Registry items in isolated consumers, compiles the installed source,
and runs interaction, presentation, and theme-restyling smoke tests.
