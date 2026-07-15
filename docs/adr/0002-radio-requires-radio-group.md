---
status: accepted
---

# Require Radio to belong to RadioGroup

## Context

The first RadioGroup tracer exposed `RadioGroup.Root`, `RadioGroup.Item`, and
`RadioGroup.Indicator`, while the earlier packaged `Radio` separately owned a
fixed visual tree and externally supplied selected state. Before removing that
legacy component, we need one canonical collection model and a clear answer
for one-choice or formerly “standalone” uses.

Base UI separates the collection owner from the selectable radio:

```tsx
<RadioGroup>
  <Radio.Root value="alpha">
    <Radio.Indicator />
  </Radio.Root>
</RadioGroup>
```

Its documentation states that Radio is always placed within RadioGroup. This
shape also matches the actual ownership in our tracer: the group Store owns the
selected value and collection coordination, while the selectable node owns
focus and activation.

## Decision

The canonical framework surface is:

```text
@tuiparts/{react,solid}/radio-group -> RadioGroup
@tuiparts/{react,solid}/radio       -> Radio.Root, Radio.Indicator
```

`RadioGroup` is a direct component and callable type namespace, not a
single-part `.Root` namespace. `Radio.Root` is the selectable radio formerly
called `RadioGroup.Item`. `Radio.Indicator` belongs to that Root.

Radio always requires RadioGroup ownership. React and Solid fail clearly when
`Radio.Root` has no RadioGroup context. Core callers pass the matching
`RadioGroupStore` to `RadioRootRenderable` and place it beneath the associated
`RadioGroupRenderable`; a detached or mismatched Radio is unavailable and
cannot focus or activate.

A one-choice UI still renders one Radio inside RadioGroup. We do not export a
hidden one-item wrapper, boolean `selected` props, a standalone Store, or a
second state machine.

The readonly Radio state uses `checked`, matching Base UI’s Radio state
vocabulary. RadioGroup continues to own `value`, `defaultValue`, and
`onValueChange`. Focus, keyboard/pointer/programmatic activation, disabled
behavior, dynamic registration, roving focus, refs, and change details remain
the existing collection behavior.

The earlier fixed-tree Radio and layout-only RadioGroup are removed without
deprecated aliases because the project is pre-release.

## Consequences

- Package imports, module namespaces, and ownership read like Base UI.
- Grouped and one-choice uses share exactly the same public API and call stack.
- `Radio.Root` never changes lifecycle or state ownership based on placement.
- Registry recipes alias `RadioPrimitive` and `RadioGroupPrimitive` locally,
  while package exports remain clean.
- Labels, marks, empty marks, layout, colors, density, and symbols remain
  consumer-owned recipe policy.
- Consumers needing an independently reversible boolean use Checkbox or
  Switch, not Radio.

## Legacy mapping

| Earlier packaged interface | Replacement |
| --- | --- |
| `Radio.selected` | `RadioGroup.value` equals the Radio’s `value` |
| `Radio.onActivate` | `RadioGroup.onValueChange` |
| `Radio.disabled` | `Radio.Root.disabled` |
| `Radio.label` | Consumer children or recipe `label` |
| `Radio.symbols` | Consumer `Radio.Indicator` and unselected content |
| `Radio.styles`, `styleResolver` | Edit/style the registry recipe |
| Radio native Box props and ref | `Radio.Root` props and `RadioRootRenderable` ref |
| layout-only legacy `RadioGroup` | Direct foundation `RadioGroup` |

## Rejected alternatives

### Let Radio work with or without RadioGroup

Rejected because conditional ownership creates two lifecycle, state, and focus
paths in one public component. A Radio without a selection owner is not a
complete radio control.

### Export a one-item convenience wrapper

Rejected because it hides RadioGroup ownership, invents boolean selection
props, and diverges from the Base UI composition users will expect when moving
between one and multiple choices.

### Keep `RadioGroup.Item` as the public name

Rejected because it obscures the independently composable Radio module and
does not match the Base UI/shadcn vocabulary chosen for this project.

## References

- [Base UI Radio documentation](https://base-ui.com/react/components/radio)
- [Base UI Radio source](https://github.com/mui/base-ui/tree/v1.6.0/packages/react/src/radio)
- [Base UI RadioGroup source](https://github.com/mui/base-ui/tree/v1.6.0/packages/react/src/radio-group)
