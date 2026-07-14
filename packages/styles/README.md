# @opentui-ui/styles

Optional, framework-neutral styling for consumer-owned OpenTUI recipes.

## Installation

```bash
pnpm add @opentui-ui/styles @opentui/core
```

Core, React, and Solid primitive packages do not import this package. Recipes
opt in when typed slots, variants, compounds, state selectors, or composition
are useful.

## Recipe Contract

```ts
import type { BoxOptions, TextOptions } from "@opentui/core";
import {
  createRecipe,
  defineRecipeContract,
  type RecipeProps,
  type StyleProps,
} from "@opentui-ui/styles";

type BaseProps = BoxOptions & { label: string; onPress?: () => void };

const contract = defineRecipeContract<BaseProps>()({
  slots: {} as {
    root: StyleProps<BoxOptions>;
    label: StyleProps<TextOptions>;
  },
  stateKeys: ["disabled", "focused"] as const,
});

export const buttonStyles = createRecipe(contract, {
  base: {
    root: { paddingX: 1 },
    label: { fg: "#E5E5E5", _disabled: { fg: "#737373" } },
  },
  variants: {
    tone: {
      neutral: { root: { backgroundColor: "#404040" } },
      danger: { root: { backgroundColor: "#991B1B" } },
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type ButtonRecipeProps = BaseProps & RecipeProps<typeof buttonStyles>;
```

The contract belongs to the recipe. Its `root` and `label` slots are private
presentation targets, not claims about the public parts exported by a
primitive. The recipe maps `buttonStyles.resolve(recipeProps, state)` onto the
OpenTUI nodes and primitive parts it owns.

Variant names that collide with `BaseProps` are rejected. A recipe cannot
silently consume `disabled`, `children`, `label`, `onPress`, or any other
behavior, content, native, or event prop declared by its component.

## Resolution

Style layers merge from lowest to highest precedence:

1. Base styles
2. Selected variants, in declaration order
3. Matching compound variants, in declaration order
4. Per-instance inline `styles`

Active underscore selectors such as `_checked`, `_focused`, and `_disabled`
resolve inside every layer. This lets a later variant or inline selector
override an earlier state result deterministically.

## Composition

`extendRecipe(base, config)` merges base styles, variant names and values,
defaults, and compounds. Its inferred props retain all inherited variants.

## Framework Use

There is no React or Solid wrapper. React recipes may call
`recipe.splitProps(props)` on each render. Solid recipes use Solid's
`splitProps()` and pass the reactive recipe-prop proxy directly to
`recipe.resolve()`. Strict examples for both frameworks live in `fixtures/`.

Imperative Core recipes can apply a resolved slot to an existing Renderable
with `assignStyleProps()`. It normalizes shorthand properties, restores native
values when a property disappears, snapshots mutable colors, and skips safe
redundant assignments without retaining component props or style layers.

## License

MIT
