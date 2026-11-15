# Empty Recipe

Empty is consumer-owned presentation, not a packaged primitive. These registry
items install editable source composed directly from OpenTUI Box and Text
nodes:

- `core.ts` exports the imperative `createEmpty`, `createEmptyHeader`, `createEmptyMedia`, `createEmptyTitle`, `createEmptyDescription`, and `createEmptyContent` recipes.
- `react.tsx` exports the React `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, and `EmptyContent` recipes.
- `solid.tsx` exports the Solid `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, and `EmptyContent` recipes.

The recipes assemble empty state callouts with dashed borders, centered alignment,
bold headings, and muted descriptions. Applications can customize any part or edit
the source directly without wrapping an opaque package component.
