# @opentui-ui/dialog

## 0.1.3

### Patch Changes

- [#65](https://github.com/tuiparts/tuiparts/pull/65) [`ad1b2e6`](https://github.com/tuiparts/tuiparts/commit/ad1b2e6c4d500be503b34973b7ad859d41780598) Thanks [@msmps](https://github.com/msmps)! - Support OpenTUI 0.4.3 through 0.5.x, including correct dialog removal and
  warning-free React and Solid provider teardown.

## 0.1.2

### Patch Changes

- [#17](https://github.com/msmps/opentui-ui/pull/17) [`2c58639`](https://github.com/msmps/opentui-ui/commit/2c5863959036229bb2dd01f6168842e574103d7f) Thanks [@ainergiz](https://github.com/ainergiz)! - fix: ensures that the container does not intercept mouse events when no dialogs are displayed

## 0.1.1

### Patch Changes

- [#14](https://github.com/msmps/opentui-ui/pull/14) [`9cb6d5e`](https://github.com/msmps/opentui-ui/commit/9cb6d5e341dc26a604c4eb5a9a417cb7a2ff73fc) Thanks [@msmps](https://github.com/msmps)! - fix: resolve flashing issues in react adapter

## 0.1.0

### Minor Changes

- [#12](https://github.com/msmps/opentui-ui/pull/12) [`1b54167`](https://github.com/msmps/opentui-ui/commit/1b541674b09f0b669ca2d93bdf8591e4aa3c38ee) Thanks [@msmps](https://github.com/msmps)!

  ### Breaking Changes

  - **React content must be a function**: `content: () => <MyDialog />` instead of `content: <MyDialog />`
  - **Backdrop options moved to top-level**: `backdropColor` and `backdropOpacity` are now on `DialogShowOptions`/`DialogContainerOptions`, not nested in `style`
  - **Removed `backdropMode`**: Backdrop stacking mode option has been removed

  ### Bug Fixes

  - Fixed `confirm()` and `choice()` ignoring `fallback` option in core
  - Fixed `ChoiceOptions<K>` generic type not properly typing `fallback`
  - Fixed focus restore timing when rapidly opening/closing dialogs

  ### Improvements

  - Added missing exports
  - Per-dialog `closeOnEscape` option now supported

  ***

  ⚠️ **Migration**: See the [README](https://github.com/msmps/opentui-ui/blob/main/packages/dialog/README.md) for updated usage examples. While this release contains breaking changes, we're still in early development (0.x). The API is now stabilized and no further breaking changes are planned.

## 0.0.5

### Patch Changes

- [`b652239`](https://github.com/msmps/opentui-ui/commit/b652239f3b55f7208bc1e4caf20132a5fc16a62f) Thanks [@msmps](https://github.com/msmps)! - fix backdrop flash when stacking dialogs in react adapter

- [#11](https://github.com/msmps/opentui-ui/pull/11) [`81a83b3`](https://github.com/msmps/opentui-ui/commit/81a83b3198fff54f8f42b7b8ac709a208b179418) Thanks [@msmps](https://github.com/msmps)! - add async prompt methods

- [`c2c4076`](https://github.com/msmps/opentui-ui/commit/c2c4076b6ae65eca66835f8929bcfbc9f0ec748d) Thanks [@msmps](https://github.com/msmps)! - fix backdrop flash when stacking dialogs in react (less leaky)

## 0.0.4

### Patch Changes

- [`ed30989`](https://github.com/msmps/opentui-ui/commit/ed30989013b542b9e2151d55d5bab82e1a21878e) Thanks [@msmps](https://github.com/msmps)! - added theme support and improved default styling options

## 0.0.3

### Patch Changes

- [`e06da56`](https://github.com/msmps/opentui-ui/commit/e06da56317d679e9c1b7c855229c2e630c2378fc) Thanks [@msmps](https://github.com/msmps)! - resolve backdrop color handling bug

## 0.0.2

### Patch Changes

- [#7](https://github.com/msmps/opentui-ui/pull/7) [`f3fa22b`](https://github.com/msmps/opentui-ui/commit/f3fa22b1d3911edfae44bd95e3018cf7f11e9609) Thanks [@msmps](https://github.com/msmps)! - initial release
