/**
 * Shared type definitions for tui.parts packages
 */

/**
 * Padding style properties with shorthand support
 *
 * Supports CSS-like padding specification:
 * - `padding`: Uniform padding for all sides
 * - `paddingX`: Horizontal padding (left and right)
 * - `paddingY`: Vertical padding (top and bottom)
 * - `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`: Individual sides
 *
 * Priority should be highest to lowest:
 * 1. Specific side (paddingTop, paddingRight, etc.)
 * 2. Axis (paddingX, paddingY)
 * 3. Uniform (padding)
 */
export interface PaddingInput {
  /** Uniform padding for all sides */
  padding?: number;
  /** Horizontal padding (left and right) */
  paddingX?: number;
  /** Vertical padding (top and bottom) */
  paddingY?: number;
  /** Top padding */
  paddingTop?: number;
  /** Right padding */
  paddingRight?: number;
  /** Bottom padding */
  paddingBottom?: number;
  /** Left padding */
  paddingLeft?: number;
}

/**
 * Padding values for all four sides
 */
export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Common border style properties
 */
export type { BorderConfig, BorderStyle } from "@opentui/core";
