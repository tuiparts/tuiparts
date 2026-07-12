/**
 * Unique symbol used to attach component metadata to headless components.
 * This metadata enables the styled() API to infer slot names, style shapes,
 * and state keys without requiring explicit generic parameters.
 */
export const $$OtuiComponentMeta: unique symbol = Symbol.for(
  "@opentui-ui/styles/component.meta",
);

/**
 * Type alias for the $$OtuiComponentMeta symbol.
 * Used in type-level operations to extract metadata from components.
 */
export type $$OtuiComponentMeta = typeof $$OtuiComponentMeta;

/**
 * Unique symbol used to mark a component as a styled component.
 * This enables composition detection when wrapping styled components.
 */
export const $$StyledComponent: unique symbol = Symbol.for(
  "@opentui-ui/styles/styled.component",
);

/**
 * Type alias for the $$StyledComponent symbol.
 */
export type $$StyledComponent = typeof $$StyledComponent;

/**
 * Unique symbol used to store the processed styled config on a styled component.
 * This enables composition by allowing styled() to extract and merge configs.
 */
export const $$StyledConfig: unique symbol = Symbol.for(
  "@opentui-ui/styles/styled.config",
);

/**
 * Type alias for the $$StyledConfig symbol.
 */
export type $$StyledConfig = typeof $$StyledConfig;

/**
 * Unique symbol used to advertise the deepest base component reachable from a
 * styled component. Set by `createStyled` (and forwarded by framework wrappers)
 * so chained `styled(styled(C, A), B)` calls render directly against `C` with
 * the merged config — instead of nesting framework wrappers and losing the
 * outer resolver.
 */
export const $$StyledBase: unique symbol = Symbol.for(
  "@opentui-ui/styles/styled.base",
);

/**
 * Type alias for the $$StyledBase symbol.
 */
export type $$StyledBase = typeof $$StyledBase;

/**
 * Prefix used for state selector keys in style definitions.
 * State selectors like `_checked`, `_focused`, `_disabled` allow
 * conditional styling based on component state.
 */
export const STATE_SELECTOR_PREFIX = "_" as const;
