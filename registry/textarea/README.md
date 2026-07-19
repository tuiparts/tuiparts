# Textarea Recipe

These files provide consumer-owned presentation for OpenTUI-native multiline
editing. The root `registry.json` exposes separate `core/textarea`,
`react/textarea`, and `solid/textarea` items.

- `core.ts` exports `createTextarea()` for imperative applications.
- `react.tsx` and `solid.tsx` export `Textarea`.
- The Recipe supplies editable height, wrapping, cursor, selection,
  placeholder, text, and focus defaults from the installed Theme Recipe.
- The packaged Primitive preserves OpenTUI's `EditBuffer`, native editing
  operations, and event order while adding disabled interaction gating.

`initialValue` uses OpenTUI's initialize-once behavior. Applications edit the
same native buffer through user input or Renderable methods such as `setText`,
`replaceText`, and `insertText`; the Recipe does not add `value`,
`defaultValue`, or a parallel owner.

From the workspace root, `pnpm validate:registry --recipe=textarea` validates
all three installed consumers and runtime smokes.
