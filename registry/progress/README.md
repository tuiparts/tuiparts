# Progress Recipe

Progress is consumer-owned presentation installed on top of the packaged headless
`@tuiparts/core/progress`, `@tuiparts/react/progress`, and `@tuiparts/solid/progress`
primitives:

- `core.ts` exports the imperative `createProgress` recipe.
- `react.tsx` exports the React `Progress` recipe.
- `solid.tsx` exports the Solid `Progress` recipe.

The recipe applies semantic `surface` track styling and `primary` indicator styling
while delegating progress state, normalization, clamping, and percentage calculation
to the headless primitive.
