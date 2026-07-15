/**
 * Opacity normalization utilities
 *
 * Converts CSS-like opacity values to terminal-compatible formats.
 */

/**
 * Default opacity value (100% - fully opaque)
 */
export const DEFAULT_OPACITY = 255;

/**
 * Normalize opacity to 0-255 integer range using CSS-like semantics.
 *
 * Accepts the following formats (aligned with CSS opacity behavior):
 * - **0-1 (number)**: Float value where 0 = transparent, 1 = opaque
 * - **"50%" (string)**: Percentage string where "0%" = transparent, "100%" = opaque
 *
 * Values are clamped to valid ranges automatically.
 *
 * @param value - The opacity value to normalize
 * @param defaultValue - Default value if undefined (defaults to DEFAULT_OPACITY)
 * @returns Normalized opacity as integer 0-255
 *
 * @example
 * ```ts
 * normalizeOpacity(0.5);       // 128 (50% opacity)
 * normalizeOpacity(1);         // 255 (fully opaque)
 * normalizeOpacity(0);         // 0 (fully transparent)
 * normalizeOpacity("50%");     // 128 (50% opacity)
 * normalizeOpacity("100%");    // 255 (fully opaque)
 * normalizeOpacity(undefined); // DEFAULT_OPACITY (~60%)
 * ```
 *
 * @throws {Error} If value is a number outside 0-1 range
 */
export function normalizeOpacity(
  value: number | string | undefined,
  defaultValue: number = DEFAULT_OPACITY,
  caller: string = "@tuiparts/utils",
): number {
  if (value === undefined) {
    return defaultValue;
  }

  // Handle percentage string (CSS-like: "50%")
  if (typeof value === "string") {
    if (value.endsWith("%")) {
      const percent = parseFloat(value);
      if (!Number.isNaN(percent)) {
        // Clamp to 0-100 range, then convert to 0-255
        const clamped = Math.min(100, Math.max(0, percent));
        return Math.round((clamped / 100) * 255);
      }
    }

    // Try parsing as a decimal number string (e.g., "0.5")
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      if (parsed < 0 || parsed > 1) {
        throw new Error(
          `[${caller}] Invalid opacity value "${value}". ` +
            `Numeric opacity must be between 0 and 1, or use a percentage string like "50%".`,
        );
      }
      return Math.round(parsed * 255);
    }

    // Invalid string format - warn and return default
    console.warn(
      `[${caller}] Invalid opacity string "${value}", using default. ` +
        `Use a number (0-1) or percentage string ("50%").`,
    );
    return defaultValue;
  }

  // Handle numeric value (CSS-like: 0-1)
  if (typeof value === "number") {
    if (value < 0 || value > 1) {
      throw new Error(
        `[${caller}] Invalid opacity value ${value}. ` +
          `Opacity must be between 0 and 1 (CSS-like), where 0 = transparent and 1 = opaque. ` +
          `For percentage, use a string like "50%".`,
      );
    }
    return Math.round(value * 255);
  }

  return defaultValue;
}

/**
 * Convert a 0-255 opacity value to a 0-1 float
 *
 * @param value - Opacity as 0-255 integer
 * @returns Opacity as 0-1 float
 */
export function opacityToFloat(value: number): number {
  return Math.min(1, Math.max(0, value / 255));
}

/**
 * Convert a 0-255 opacity value to a percentage string
 *
 * @param value - Opacity as 0-255 integer
 * @returns Opacity as percentage string (e.g., "50%")
 */
export function opacityToPercent(value: number): string {
  const percent = Math.round((value / 255) * 100);
  return `${percent}%`;
}
