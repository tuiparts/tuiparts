# Checkbox Recipe Tracer

These files represent the consumer-owned layer of the Checkbox tracer. The
root `registry.json` exposes separate `core/checkbox`, `react/checkbox`, and
`solid/checkbox` items so consumers explicitly install the recipe for their
framework. Installation copies editable source into `components/ui` while
keeping `CheckboxStore`, `CheckboxRootRenderable`, and
`CheckboxIndicatorRenderable` in versioned packages.

- `react.tsx` is the editable React recipe.
- `solid.tsx` is the equivalent Solid recipe.
- `core.ts` is the imperative recipe.

Each recipe chooses layout, colors, the default mark, and the convenience
`label` prop. The packaged primitive owns checked state, focus, activation,
disabled behavior, and Indicator lifecycle. The current Root, Indicator,
readonly state, refs, lifecycle, and ownership interfaces are tracer evidence,
not the frozen foundation contract.

Runnable versions with controlled, uncontrolled, custom-mark, and disabled
examples live in the local `examples/*` workspaces and can be started with
`pnpm dev:checkbox` from the relevant workspace.

The three `tsconfig.*.json` fixtures compile each recipe against its intended
framework contract.

From the workspace root, `pnpm validate:registry` installs all three items with
the official shadcn CLI in isolated consumers, compiles the installed source,
and runs controlled, uncontrolled, disabled, and custom-mark runtime smokes.
