# InputOTP Recipe

A segmented one-time password / PIN code input recipe for OpenTUI.

## Features

- Multi-cell segmented digit/character display with active borders.
- Auto-advance on character entry and auto-retreat on backspace.
- Left/Right arrow key navigation between slots.
- Optional character masking (`*` or custom glyph).
- Full compatibility with OpenTUI theme tokens.

## Files

- `core.ts`: Imperative OpenTUI Renderable (`InputOTPRenderable`).
- `react.tsx`: Declarative React components (`InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`).
- `solid.tsx`: Reactive Solid components (`InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`).
