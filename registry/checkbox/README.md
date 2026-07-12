# Checkbox Recipe Tracer

These files represent the consumer-owned layer of the Checkbox tracer. A
future registry installer would copy the framework-appropriate recipe into an
application while keeping `CheckboxStore`, `CheckboxRootRenderable`, and
`CheckboxIndicatorRenderable` in versioned packages.

- `react.tsx` is the editable React recipe.
- `solid.tsx` is the equivalent Solid recipe.
- `core.ts` is the imperative recipe.

Each recipe chooses layout, colors, the default mark, and the convenience
`label` prop. The packaged primitive owns checked state, focus, activation,
disabled behavior, and Indicator lifecycle.

Runnable versions with controlled, uncontrolled, custom-mark, and disabled
examples live in the local `examples/*` workspaces and can be started with
`pnpm dev:checkbox` from the relevant workspace.

The three `tsconfig.*.json` fixtures compile each recipe against its intended
framework contract.
