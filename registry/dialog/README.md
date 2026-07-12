# Dialog Recipe Tracer

The root registry exposes `core/dialog`, `react/dialog`, and `solid/dialog`.
Each item copies an editable composition into `components/ui/dialog.*`; it does
not replace the foundation Dialog primitive exported by `@opentui-ui/core`,
`@opentui-ui/react`, and `@opentui-ui/solid`.

The recipe owns the terminal-wide black backdrop, centered popup, border,
padding, colors, title and description treatment, and the `× Close` affordance.
It intentionally keeps convenience props small (`title`, optional
`description`, and optional `closeLabel`) so applications can edit the source.

## Ownership and interaction

The packaged primitive owns trigger/open state, controlled and uncontrolled
coordination, Escape and topmost-backdrop arbitration, focus containment and
restoration, nesting/stacking, and close event details. Recipes only compose
the public Root, Trigger, Portal, Backdrop, Popup, Title, Description, and
Close parts. Do not recreate these behaviors in copied recipe code.

`open` makes state controlled: `onOpenChange` receives one intent and the
owner must provide the next `open` value. `defaultOpen` is uncontrolled. Escape
and backdrop interaction target only the topmost eligible layer; a popup click
does not dismiss it. Nested dialogs receive a higher layer and closing one
restores focus to its parent or original trigger.

These parts and their ownership contracts are **tracer evidence, not a frozen
foundation API**. The legacy production `@opentui-ui/dialog` manager, provider,
and async APIs stay separate and unchanged.

The `tsconfig.*.json` fixtures compile copied recipes against each supported
surface. `pnpm validate:registry` builds and installs all 12 registry items in
clean consumers, compares exact source and dependencies, type-checks them, and
runs their runtime smokes.
