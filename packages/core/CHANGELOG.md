# @tuiparts/core

## 0.0.3

### Patch Changes

- [`230b998`](https://github.com/tuiparts/tuiparts/commit/230b998209ebf8a509933882f23f54273845a9a4) Thanks [@msmps](https://github.com/msmps)! - Add the complete Tabs Primitive vertical with Core behavior, React and Solid
  compound Parts, packed subpaths, and consumer-owned Registry Recipes.

- [`fb5973e`](https://github.com/tuiparts/tuiparts/commit/fb5973e835278685d540fbd40baebe602ceec4ba) Thanks [@msmps](https://github.com/msmps)! - Add the ship-ready Textarea Primitive and adapters, preserving OpenTUI's
  native multiline EditBuffer and event model with consistent disabled gating.

## 0.0.2

### Patch Changes

- [#41](https://github.com/tuiparts/tuiparts/pull/41) [`76c96b2`](https://github.com/tuiparts/tuiparts/commit/76c96b2ed275df772814e3de1061ebdcb6ecc092) Thanks [@msmps](https://github.com/msmps)! - Add Toggle and ToggleGroup foundation primitives, framework adapters, and
  editable registry recipes with controlled and uncontrolled pressed state,
  single or multiple group selection, orientation-aware roving focus, and
  immutable terminal activation details.

- [#46](https://github.com/tuiparts/tuiparts/pull/46) [`9a281e8`](https://github.com/tuiparts/tuiparts/commit/9a281e8f2b942cc5267578133f289a1d4801c626) Thanks [@msmps](https://github.com/msmps)! - Collapse Checkbox and Switch Store facades onto the shared internal checked-state implementation. This is an internal refactor; public APIs and behavior are unchanged.

- [#47](https://github.com/tuiparts/tuiparts/pull/47) [`54514d2`](https://github.com/tuiparts/tuiparts/commit/54514d2e48647d174ddd553c9aa276488c10a1a1) Thanks [@msmps](https://github.com/msmps)! - De-slop pass across the foundation surface:

  - Stores expose state through the `state` getter only; the duplicate
    `getState()` methods on ButtonStore, ToggleStore, and the shared
    checked-state implementation are removed (Renderables keep `getState()` —
    that is the adapter seam).
  - Dialog Title and Description no longer take or hold a `store`; the field
    was write-only.
  - The core root barrel now exports all seven primitive Stores and their
    options types.
  - Listener notification uses one re-entrancy posture everywhere: iterate a
    copy, skip listeners that unsubscribed mid-notification.

- [#44](https://github.com/tuiparts/tuiparts/pull/44) [`efc8768`](https://github.com/tuiparts/tuiparts/commit/efc8768104834a3171dbbc89707812d7ef405471) Thanks [@msmps](https://github.com/msmps)! - Concentrate activation behavior in one internal Pressable base class
  (ADR-0007). Checkbox, Switch, Button, Toggle, Radio, and Dialog Trigger/Close
  now share a single interaction contract instead of five drifted copies.

  Behavior changes:

  - Keyboard activation everywhere is an uncancelled, unmodified Space or Enter
    press. Modifier chords (Ctrl/Meta/Shift/Option/Super/Hyper) and keys with
    `defaultPrevented` no longer activate any Root. Previously Checkbox and
    Switch ignored both guards, Button ignored modifiers, Radio ignored
    cancellation, and Dialog Trigger/Close ignored everything.
  - Pointer activation everywhere requires an uncancelled primary-button press
    that starts and ends on the node (Button's model). Previously every
    non-Button Root activated on any primary release over the node, including
    drags that started elsewhere.

  Breaking (pre-release):

  - `RadioGroupChangeDetails.source` renames `"programmatic"` to
    `"imperative"`, unifying the press vocabulary across the catalog.
  - `PressDetails` is exported from the core root as the canonical gesture
    type; `ButtonPressDetails` and `ToggleChangeDetails` remain as aliases.

- [#41](https://github.com/tuiparts/tuiparts/pull/41) [`76c96b2`](https://github.com/tuiparts/tuiparts/commit/76c96b2ed275df772814e3de1061ebdcb6ecc092) Thanks [@msmps](https://github.com/msmps)! - Share one internal roving-collection engine between RadioGroup and
  ToggleGroup. Both Stores keep their public interfaces and selection semantics
  while item registration, availability, rendered ordering, tab-stop
  reconciliation, and re-entrant mutation queuing now live in a single audited
  implementation, and collection refreshes no longer publish no-op snapshots.

## 0.0.1

### Patch Changes

- [#26](https://github.com/tuiparts/tuiparts/pull/26) [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8) Thanks [@msmps](https://github.com/msmps)! - Add the unstyled single-part `Button` foundation interface with an attachable
  Core `ButtonStore`, module-scoped `Button.Props`, `Button.State`, and
  `Button.PressDetails` framework types, Renderable refs, and editable recipes.

- [#26](https://github.com/tuiparts/tuiparts/pull/26) [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8) Thanks [@msmps](https://github.com/msmps)! - Add foundation Dialog behavior with canonical `Dialog.Root` compound adapters,
  part-scoped Props and State types, and editable registry recipes.

- [#28](https://github.com/tuiparts/tuiparts/pull/28) [`d148be5`](https://github.com/tuiparts/tuiparts/commit/d148be507856843e6f0b6fe8f2f6a9e9a4fe1762) Thanks [@msmps](https://github.com/msmps)! - Make disabled controls truthful focus-traversal candidates, preserve rendered
  Dialog focus order and programmatic focus restoration, and reshape the Dialog
  recipes into responsive shadcn-style compound exports. Registry builds now
  prepare nested item paths and React recipes install their required type
  declarations.

- [#26](https://github.com/tuiparts/tuiparts/pull/26) [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8) Thanks [@msmps](https://github.com/msmps)! - Add the canonical unstyled `Input`, `Input.Props`, and `InputRenderable`
  interfaces while preserving OpenTUI-native value, input, change, and submit
  behavior.

- [#26](https://github.com/tuiparts/tuiparts/pull/26) [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8) Thanks [@msmps](https://github.com/msmps)! - Keep framework Store wiring private, make Checkbox and Switch inert after
  destruction, type every Dialog part ref to its Core Renderable, and construct
  React Dialog portals only after commit. Strengthen packed executable and
  registry compatibility validation.

- [#26](https://github.com/tuiparts/tuiparts/pull/26) [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8) Thanks [@msmps](https://github.com/msmps)! - Remove the pre-release behaviorless Badge package modules, fixed Renderable
  tree, adapter exports, styling metadata, and `/badge` subpaths. Remove the
  orphaned fixed-label Button implementation now that the package exports only
  the foundation activation primitive. Badge is distributed only as editable
  Core, React, and Solid registry recipe source. No deprecated aliases remain.

- [#26](https://github.com/tuiparts/tuiparts/pull/26) [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8) Thanks [@msmps](https://github.com/msmps)! - Add the canonical direct `RadioGroup` collection and `Radio.Root` /
  `Radio.Indicator` interfaces with keyboard navigation, dynamic Radio lifecycle,
  direct Core Renderable registration, Base UI-aligned package subpaths, and
  editable recipes. Remove the pre-release fixed-tree Radio and layout-only
  RadioGroup interfaces without deprecated aliases.

- [#32](https://github.com/tuiparts/tuiparts/pull/32) [`e47a2f0`](https://github.com/tuiparts/tuiparts/commit/e47a2f05aff03c0e47b0dc787067eb9389db69b7) Thanks [@msmps](https://github.com/msmps)! - Renamed the npm scope from `@opentui-ui` to `@tuiparts`. The project is now
  tuiparts.sh — the primitive and recipe ecosystem for OpenTUI. Package behavior
  and APIs are unchanged; only the name moved. The final `@opentui-ui/*`
  releases are deprecated with pointers to their `@tuiparts/*` successors.

  The dialog, toast, and utils packages are deferred from the initial foundation
  release per release policy and receive their scope-rename release together
  afterward (dialog and toast depend on utils).

- [#26](https://github.com/tuiparts/tuiparts/pull/26) [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8) Thanks [@msmps](https://github.com/msmps)! - Add the unstyled `Switch.Root` and `Switch.Thumb` foundation interfaces with an
  attachable Core `SwitchStore`, direct Store ownership for Thumb, part-scoped
  framework types, automatic React wiring, and editable registry recipes.

- [#26](https://github.com/tuiparts/tuiparts/pull/26) [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8) Thanks [@msmps](https://github.com/msmps)! - Harden the canonical `Checkbox.Root` and `Checkbox.Indicator` contract across
  Core, React, and Solid with an attachable Core `CheckboxStore`, part-scoped
  framework types, direct Store ownership for Indicator, automatic React wiring,
  primary-pointer cancellation, and retained Indicator lifecycle.

- [#26](https://github.com/tuiparts/tuiparts/pull/26) [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8) Thanks [@msmps](https://github.com/msmps)! - Remove component metadata, framework styled wrappers, Renderable registration
  factories, fixed-tree styling machinery, and primitive-package styling
  dependencies without deprecated aliases. Consumer-owned registry recipes use
  plain TypeScript and native OpenTUI properties.
