# Collapsible Recipe

These files are the consumer-owned presentation layer for Collapsible. The
root `registry.json` exposes separate `core/collapsible`, `react/collapsible`,
and `solid/collapsible` items. Installation copies editable source into
`components/ui` while open-state ownership and interaction remain in the
versioned Collapsible Primitive.

- `react.tsx` is the editable React Recipe.
- `solid.tsx` is the equivalent Solid Recipe.
- `core.ts` is the imperative Recipe.

Each Recipe chooses a vertical layout, disclosure markers, spacing, colors,
content indentation, and the labeled Trigger convenience interface. The
packaged Primitive owns controlled and uncontrolled open state, focus,
activation, disabled behavior, and Panel lifecycle.

From the workspace root, `pnpm validate:registry --recipe=collapsible`
installs all three Registry items in isolated consumers, compiles the installed
source, and runs interaction, presentation, and theme-restyling smoke tests.
