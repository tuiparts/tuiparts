# Avatar Recipe

Avatar is consumer-owned presentation, not a packaged primitive. These registry
items install editable source composed directly from OpenTUI Box and Text
nodes:

- `core.ts` exports the imperative `createAvatar`, `createAvatarFallback`, and `createAvatarImage` recipes.
- `react.tsx` exports the React `Avatar`, `AvatarFallback`, and `AvatarImage` recipes.
- `solid.tsx` exports the Solid `Avatar`, `AvatarFallback`, and `AvatarImage` recipes.

The recipes provide framed avatar boxes with size variants (`sm`, `default`, `lg`),
surface backgrounds, and bold initials fallback presentation.
