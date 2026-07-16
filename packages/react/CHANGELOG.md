# @tuiparts/react

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

- [#26](https://github.com/tuiparts/tuiparts/pull/26) [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8) Thanks [@msmps](https://github.com/msmps)! - Stop declaring `ws` as a tuiparts.sh peer. Applications install the React
  adapter and its OpenTUI/React peers without duplicating an upstream runtime
  concern in this package or registry recipes.

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
- Updated dependencies [[`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8), [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8), [`d148be5`](https://github.com/tuiparts/tuiparts/commit/d148be507856843e6f0b6fe8f2f6a9e9a4fe1762), [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8), [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8), [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8), [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8), [`e47a2f0`](https://github.com/tuiparts/tuiparts/commit/e47a2f05aff03c0e47b0dc787067eb9389db69b7), [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8), [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8), [`7e58e0f`](https://github.com/tuiparts/tuiparts/commit/7e58e0f1b361551c1f746587a52cb46346a3fda8)]:
  - @tuiparts/core@0.0.1
