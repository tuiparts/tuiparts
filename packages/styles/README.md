# @opentui-ui/styles

Framework-neutral styling engine for slot-based OpenTUI UI components.

## Installation

```bash
pnpm add @opentui-ui/styles
```

Most applications use the framework-specific `styled()` export from
`@opentui-ui/react/styled` or `@opentui-ui/solid/styled`. This package provides
the metadata, types, merge logic, and resolver underneath both adapters.

Component text slots consistently use `color` and `backgroundColor`; adapters
translate those names to OpenTUI's primitive-specific `fg`, `bg`, or
`textColor` properties.

## Configuration

```ts
const config = {
  base: {
    box: { gap: 1, backgroundColor: "transparent" },
    mark: {
      color: "#737373",
      _checked: { color: "#22C55E" },
      _focused: { color: "#60A5FA" },
    },
    label: { color: "#E5E5E5" },
  },
  variants: {
    tone: {
      normal: { label: { color: "#E5E5E5" } },
      danger: { label: { color: "#FCA5A5" } },
    },
    size: {
      compact: { box: { gap: 0 } },
      normal: { box: { gap: 1 } },
    },
  },
  compoundVariants: [
    {
      tone: "danger",
      size: "compact",
      styles: { mark: { color: "#EF4444" } },
    },
  ],
  defaultVariants: {
    tone: "normal",
    size: "normal",
  },
};
```

## Resolution Order

Styles merge from lowest to highest precedence:

1. `base`
2. selected variants, in declaration order
3. matching compound variants, in declaration order
4. per-instance inline `styles`
5. matching state selectors inside each resolved slot

Slot objects merge by property. A later slot property replaces the earlier
value without discarding unrelated properties in that slot.

## State Selectors

Selectors use an underscore followed by a component metadata state key, such
as `_checked`, `_selected`, `_focused`, `_pressed`, or `_disabled`. They may be
used in base, variant, compound-variant, and inline slot styles. Components
without state keys do not accept selectors.

## Inline Overrides

Framework styled components accept a final `styles` prop:

```tsx
<StyledCheckbox
  tone="danger"
  styles={{
    mark: { color: "#F59E0B", _checked: { color: "#D97706" } },
  }}
/>
```

React callers should keep dynamic inline objects referentially stable when
practical. Solid tracks variant and style getters reactively.

## Composition

Calling `styled()` on an already styled component merges both processed
configurations and retains the deepest unstyled base. This avoids nested
Renderable wrappers and duplicate registration.

Low-level consumers can use `createStyled`, `createStyleResolver`,
`processStyledConfig`, `resolveStyles`, `mergeStyledConfig`, and the exported
metadata/type helpers directly.

## License

MIT
