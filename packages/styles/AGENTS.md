# packages/styles

## OVERVIEW

Optional recipe/design-system engine with type-safe variants, slot-based
composition, and state-driven pseudo selectors. Primitive behavior must not
depend on this package.

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Create styled component | `styled.ts` | `createStyled()` factory |
| Resolve styles at runtime | `resolve.ts` | `resolveStyles()` with state/variants |
| Merge configs (composition) | `merge.ts` | `mergeStyledConfig()` for styled(styled()) |
| Type definitions | `types.ts` | All interfaces and type helpers |
| Symbols | `symbols.ts` | `$$OtuiComponentMeta`, `$$StyledComponent` |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `createStyled` | Function | `styled.ts:100` | Factory that creates styled component definitions |
| `processStyledConfig` | Function | `resolve.ts:24` | Pre-processes config, creates `variantNameSet` for O(1) lookup |
| `resolveStyles` | Function | `resolve.ts:69` | Runtime resolution: base -> variants -> compounds -> inline |
| `createStyleResolver` | Function | `resolve.ts:282` | Creates state->styles function for framework wrappers |
| `splitVariantProps` | Function | `styled.ts:222` | Separates variant props from forward props |
| `mergeStyledConfig` | Function | `merge.ts:219` | Merges configs for composition (styled chaining) |
| `mergeSlotStyles` | Function | `merge.ts:83` | Per-slot style merging with selector handling |
| `StyledConfig` | Interface | `types.ts:212` | Config shape: base, variants, compoundVariants, defaultVariants |
| `ProcessedStyledConfig` | Interface | `types.ts:255` | Normalized config with pre-computed `variantNameSet` |

## PATTERNS

### Style Resolution Order
Later layers override earlier (mutation accumulator for performance):
1. Base styles (with state selectors applied)
2. Variant styles (with state selectors applied)
3. Compound variant styles (with state selectors applied)
4. Inline styles (with state selectors applied)

### State Selectors
Prefix `_` maps to component state keys. Selectors are flattened based on active state:
```ts
{ color: "white", _checked: { color: "green" }, _focused: { borderColor: "blue" } }
// When checked=true, focused=false -> { color: "green" }
```

### Composition
`styled(styled(Component))` merges configs via `mergeStyledConfig`:
- `base`: Deep merge (override wins)
- `variants`: Merge by name, extend values
- `defaultVariants`: Shallow merge (override wins)
- `compoundVariants`: Append (override after base)

### Component Metadata Bridge
Components must have `[$$OtuiComponentMeta]` with `slots`, `slotStyleMap`, `stateKeys`. This enables type-safe slot/state inference in `styled()`.

### Variant Name Set Optimization
`ProcessedStyledConfig.variantNameSet` is a `ReadonlySet<string>` for O(1) lookup in `splitVariantProps`, avoiding iteration over variant keys at render time.
