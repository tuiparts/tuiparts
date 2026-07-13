# Badge Recipe

Badge is consumer-owned presentation, not a packaged primitive. These registry
items install editable source composed directly from OpenTUI Box and Text
nodes:

- `core.ts` exports the imperative `createBadge` recipe.
- `react.tsx` exports the React `Badge` recipe.
- `solid.tsx` exports the Solid `Badge` recipe.

The recipes choose label assembly, intent palettes, size, padding, and default
colors. Native root properties and `labelOptions` are applied after those
defaults, so applications can customize an instance or edit the source without
wrapping an opaque package component.

## Earlier package mapping

| Earlier packaged interface | Editable recipe replacement |
| --- | --- |
| `Badge` / `BadgeRenderable` | Registry `Badge` / `createBadge` |
| `label` | Recipe `label` |
| root native properties | Recipe root properties |
| `styles.root` | Root properties or edit the recipe defaults |
| `styles.label` | `labelOptions` or edit the label node |
| `styleResolver` | Local recipe logic or optional recipe styling |
| `BADGE_SLOTS`, `BADGE_META` | Recipe source structure; no packaged metadata |
| `@opentui-ui/{core,react,solid}/badge` | `core/badge`, `react/badge`, or `solid/badge` registry item |

No compatibility alias is retained because the removed package surface was
pre-release.
