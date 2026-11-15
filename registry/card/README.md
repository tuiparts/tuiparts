# Card Recipe

Card is consumer-owned presentation, not a packaged primitive. These registry
items install editable source composed directly from OpenTUI Box and Text
nodes:

- `core.ts` exports the imperative `createCard`, `createCardHeader`, `createCardTitle`, `createCardDescription`, `createCardContent`, and `createCardFooter` recipes.
- `react.tsx` exports the React `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` recipes.
- `solid.tsx` exports the Solid `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` recipes.

The recipes provide sensible defaults for card borders, background, padding,
and typography based on the installed theme tokens. Native Box and Text
properties are applied after those defaults, allowing applications to
freely customize or rearrange components without wrapper constraints.
