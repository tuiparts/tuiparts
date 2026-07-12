<div align="center">
  <img width="512" src="https://github.com/msmps/opentui-ui/raw/main/packages/dialog/assets/banner.png" />
</div>

<br />

<div align="center"><strong>A dialog/modal library for terminal UIs built on OpenTUI</strong></div>
<div align="center">
  <sub>Built by <a href="https://x.com/msmps_">Matt Simpson</a></sub>
</div>

<br />

## Features

- Lightweight default styling
- Size presets (small, medium, large, full)
- Click-to-close backdrop (opt-in)
- ESC key to close
- Dialog stack support (multiple dialogs)
- Focus management (saves/restores focus on open/close)
- Theme presets (minimal, unstyled)
- React and Solid.js integrations

## Table of Contents

- [Installation](#installation)
- [Core Usage](#core-usage)
  - [Quick Start](#quick-start)
  - [Quick Reference](#quick-reference)
  - [Choosing the Right Method](#choosing-the-right-method)
  - [Async Prompts](#async-prompts)
  - [API Reference](#api-reference)
- [Framework Adapters (React & Solid)](#framework-adapters-react--solid)
  - [Setup](#setup)
  - [Choosing the Right Method](#choosing-the-right-method-1)
  - [Async Prompts (Framework)](#async-prompts-framework)
  - [useDialog() Hook](#usedialog-hook)
  - [useDialogState() Hook](#usedialogstate-hook)
  - [useDialogKeyboard() Hook](#usedialogkeyboard-hook)
  - [Full Example](#full-example)
- [Customization](#customization)
  - [Default Styling](#default-styling)
  - [Themes](#themes)
  - [Unstyled Mode](#unstyled-mode)
  - [Size Presets](#size-presets)
- [TypeScript](#typescript)
- [License](#license)

## Installation

```bash
bun add @opentui-ui/dialog
```

---

## Core Usage

Use the core API when working directly with `@opentui/core` renderables without a framework.

### Quick Start

```ts
import { DialogContainerRenderable, DialogManager } from "@opentui-ui/dialog";
import { TextRenderable } from "@opentui/core";

// 1. Create the manager and container
const manager = new DialogManager(renderer);
const container = new DialogContainerRenderable(renderer, { manager });
renderer.root.add(container);

// 2. Show dialogs from anywhere!
manager.show({
  content: (ctx) => new TextRenderable(ctx, { content: "Hello World!" }),
});
```

### Quick Reference

```ts
// Show dialogs
manager.show({ content: (ctx) => new TextRenderable(ctx, { content: "Hello" }) });
manager.show({ content: fn, size: "large" });        // With size preset
manager.show({ content: fn, id: "my-dialog" });      // With custom ID

// Close dialogs
manager.close();        // Close top-most
manager.close(id);      // Close specific
manager.closeAll();     // Close all
manager.replace({...}); // Close all and show new

// Query state
manager.isOpen();       // boolean
manager.getDialogs();   // readonly Dialog[]
manager.getTopDialog(); // Dialog | undefined
```

### Choosing the Right Method

| Method | Best For | `dialogId` Available | Keyboard Handling |
|--------|----------|---------------------|-------------------|
| `confirm()` | Yes/No decisions | ✅ via context | ✅ `useDialogKeyboard` works |
| `alert()` | Acknowledgments | ✅ via context | ✅ `useDialogKeyboard` works |
| `prompt<T>()` | Getting user input | ✅ via context | ✅ `useDialogKeyboard` works |
| `choice<K>()` | Multiple options | ✅ via context | ✅ `useDialogKeyboard` works |
| `show()` | Non-interactive display | ❌ | ❌ Manual workarounds needed |

**Use async methods** for any dialog requiring user interaction or keyboard handling. They provide `dialogId` in the content context, enabling proper keyboard event scoping.

**Use `show()`** only for non-interactive dialogs that need external lifecycle control:

```ts
// Loading dialog pattern - close from outside
const loadingId = manager.show({
  content: (ctx) => new TextRenderable(ctx, { content: "Loading..." }),
});

await performOperation();

manager.close(loadingId);
```

### Async Prompts

For common dialog patterns, use the built-in async methods that return Promises. Content functions receive **both** `renderCtx` and the dialog context, with `renderCtx` first to match the OpenTUI pattern:

```ts
import { BoxRenderable, TextRenderable } from "@opentui/core";

// Confirmation dialog - returns boolean
const confirmed = await manager.confirm({
  content: (renderCtx, { resolve, dismiss }) => {
    const box = new BoxRenderable(renderCtx, { flexDirection: "column" });
    const title = new TextRenderable(renderCtx, { content: "Delete file?" });
    box.add(title);

    const buttons = new BoxRenderable(renderCtx, { flexDirection: "row" });
    const cancelBtn = new TextRenderable(renderCtx, { content: "Cancel" });
    cancelBtn.on("mouseUp", dismiss);
    const confirmBtn = new TextRenderable(renderCtx, { content: "Confirm" });
    confirmBtn.on("mouseUp", () => resolve(true));
    buttons.add(cancelBtn);
    buttons.add(confirmBtn);
    box.add(buttons);

    return box;
  },
  fallback: false, // Optional: value when dismissed via ESC/backdrop (default: false)
});

// Alert dialog - returns void
await manager.alert({
  content: (renderCtx, { dismiss }) => {
    const box = new BoxRenderable(renderCtx, { flexDirection: "column" });
    const text = new TextRenderable(renderCtx, { content: "Operation complete!" });
    box.add(text);
    const okBtn = new TextRenderable(renderCtx, { content: "OK" });
    okBtn.on("mouseUp", dismiss);
    box.add(okBtn);
    return box;
  },
});

// Choice dialog - returns selected key or undefined
const action = await manager.choice<"save" | "discard">({
  content: (renderCtx, { resolve, dismiss }) => {
    const box = new BoxRenderable(renderCtx, { flexDirection: "column" });
    // ... build UI
    return box;
  },
  fallback: "discard", // Optional: value when dismissed via ESC/backdrop
});

// Generic prompt - returns typed value or undefined
const value = await manager.prompt<string>({
  content: (renderCtx, { resolve, dismiss }) => {
    const box = new BoxRenderable(renderCtx, { flexDirection: "column" });
    // ... build UI
    return box;
  },
  fallback: "default", // Optional: value when dismissed via ESC/backdrop
});
```

#### Context Methods at a Glance

| Method | Returns | Context Properties | Notes |
| ------ | ------- | ------------------ | ----- |
| `confirm()` | `Promise<boolean>` | `resolve(boolean)`, `dismiss()`, `dialogId` | `resolve(true)` = confirm, `dismiss()` = cancel |
| `alert()` | `Promise<void>` | `dismiss()`, `dialogId` | Just acknowledge and close |
| `choice<K>()` | `Promise<K \| undefined>` | `resolve(key)`, `dismiss()`, `dialogId` | `dismiss()` returns `undefined` |
| `prompt<T>()` | `Promise<T \| undefined>` | `resolve(value)`, `dismiss()`, `dialogId` | `dismiss()` returns `undefined` |

> **Pattern summary:**
> - `resolve(value)` — complete the dialog with a value
> - `dismiss()` — close without a value (or acknowledge for alerts)
> - `dialogId` — unique ID for this dialog

> **Programmatic close:** If you need to close an async dialog externally (e.g., from a timer or external event), capture the `dialogId` from the context. Calling `manager.close(dialogId)` will close the dialog and resolve the promise with the fallback value (`undefined`, `false`, etc.) — the promise will not be left pending.

### API Reference

#### `DialogManager`

```typescript
const manager = new DialogManager(renderer);

// Show a dialog - returns the dialog ID
const id = manager.show({
  content: (ctx) => new TextRenderable(ctx, { content: "Hello" }),
  size?: "small" | "medium" | "large" | "full",
  style?: DialogStyle,
  unstyled?: boolean,
  backdropColor?: string, // default: "#000000"
  backdropOpacity?: number | string, // 0-1 or "50%" (default: 0.35)
  closeOnEscape?: boolean, // default: true (per-dialog override)
  closeOnClickOutside?: boolean, // default: false
  onClose?: () => void,
  onOpen?: () => void,
  onBackdropClick?: () => void,
  id?: string | number, // optional custom ID
});

// Close dialogs
manager.close();        // Close top-most
manager.close(id);      // Close specific
manager.closeAll();     // Close all
manager.replace({...}); // Close all and show new

// Query state
manager.isOpen();       // boolean
manager.getDialogs();   // readonly Dialog[]
manager.getTopDialog(); // Dialog | undefined

// Async prompt methods
const confirmed = await manager.confirm({ content: ... });
const value = await manager.prompt<string>({ content: ... });
await manager.alert({ content: ... });
const choice = await manager.choice<"a" | "b">({ content: ... });

// Subscribe to changes
const unsubscribe = manager.subscribe((data) => {
  // Called when dialogs change
});

// Cleanup
manager.destroy();
```

#### `DialogContainerRenderable`

```typescript
const container = new DialogContainerRenderable(renderer, {
  manager, // Required: DialogManager instance
  size: "medium", // Default size preset
  dialogOptions: {
    // Default style options for all dialogs
    style: DialogStyle,
  },
  sizePresets: {
    // Custom size presets (terminal columns)
    small: 40,
    medium: 60,
    large: 80,
  },
  backdropColor: "#000000", // Default backdrop color
  backdropOpacity: 0.35, // 0-1 or "50%" (default: 0.35)
  closeOnEscape: true, // ESC key closes top dialog (default: true)
  closeOnClickOutside: false, // Backdrop click closes top dialog (default: false)
  unstyled: false, // Disable default styles (default: false)
});

// Add to render tree
renderer.root.add(container);
```

#### `DialogStyle`

```typescript
interface DialogStyle {
  // Content panel
  backgroundColor?: string; // Default: "#262626"
  borderColor?: string;
  borderStyle?: BorderStyle;
  border?: boolean; // Default: false

  // Sizing
  width?: number | string;
  maxWidth?: number;
  minWidth?: number;
  maxHeight?: number;

  // Padding (default: 1 cell all around)
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
}
```

---

## Framework Adapters (React & Solid)

Both frameworks share the same API pattern with `DialogProvider`, `useDialog()`, and `useDialogState()`.

### Setup

```tsx
// React
import {
  DialogProvider,
  useDialog,
  useDialogKeyboard,
  useDialogState,
} from "@opentui-ui/dialog/react";

// Solid
import {
  DialogProvider,
  useDialog,
  useDialogKeyboard,
  useDialogState,
} from "@opentui-ui/dialog/solid";

function App() {
  return (
    <DialogProvider size="medium">
      <MyContent />
    </DialogProvider>
  );
}
```

#### Using Themes

```tsx
import { DialogProvider } from "@opentui-ui/dialog/react";
import { themes } from "@opentui-ui/dialog/themes";

function App() {
  return (
    <DialogProvider {...themes.minimal}>
      <MyContent />
    </DialogProvider>
  );
}
```

### Choosing the Right Method

See the [comparison table in Core Usage](#choosing-the-right-method) for when to use `show()` vs async methods.

**TL;DR:** Use async methods (`confirm`, `alert`, `prompt`, `choice`) for interactive dialogs. Use `show()` only for non-interactive display (loading spinners) that need external lifecycle control:

```tsx
// Loading dialog - close from outside
const loadingId = dialog.show({ content: () => <LoadingSpinner /> });
await performOperation();
dialog.close(loadingId);
```

### Async Prompts (Framework)

Content functions receive only the **dialog context** (`resolve`, `dismiss`, `dialogId`) — no `renderCtx` needed:

```tsx
// Confirmation dialog - returns boolean
const confirmed = await dialog.confirm({
  content: (ctx) => (
    <box flexDirection="column">
      <text>Delete this file?</text>
      <box flexDirection="row" gap={1}>
        <text onMouseUp={ctx.dismiss}>Cancel</text>
        <text onMouseUp={() => ctx.resolve(true)}>Confirm</text>
      </box>
    </box>
  ),
  fallback: false, // Optional: value when dismissed via ESC/backdrop (default: false)
});

// Alert dialog - returns void (just acknowledgment)
await dialog.alert({
  content: (ctx) => (
    <box flexDirection="column">
      <text>Operation complete!</text>
      <text onMouseUp={ctx.dismiss}>OK</text>
    </box>
  ),
});

// Choice dialog - returns selected key or undefined
const action = await dialog.choice<"save" | "discard">({
  content: (ctx) => (
    <box flexDirection="column">
      <text>Unsaved changes</text>
      <text onMouseUp={() => ctx.resolve("save")}>Save</text>
      <text onMouseUp={() => ctx.resolve("discard")}>Discard</text>
      <text onMouseUp={ctx.dismiss}>Cancel</text>
    </box>
  ),
  fallback: "discard", // Optional: value when dismissed via ESC/backdrop
});

// Generic prompt - returns typed value or undefined
const name = await dialog.prompt<string>({
  content: (ctx) => (
    <box flexDirection="column">
      <text>Enter your name:</text>
      <input onSubmit={(value) => ctx.resolve(value)} />
      <text onMouseUp={ctx.dismiss}>Cancel</text>
    </box>
  ),
  fallback: "Anonymous", // Optional: value when dismissed via ESC/backdrop
});
```

#### Building Custom Async Dialogs

The `confirm()`, `alert()`, and `choice()` methods are convenience wrappers. For custom patterns, use `prompt<T>()` directly:

```tsx
// Example: A rating dialog that returns 1-5
const rating = await dialog.prompt<number>({
  content: (ctx) => (
    <box flexDirection="column">
      <box flexDirection="row" gap={1}>
        {[1, 2, 3, 4, 5].map((n) => (
          <text key={n} onMouseUp={() => ctx.resolve(n)}>
            {n}
          </text>
        ))}
      </box>
      <text onMouseUp={ctx.dismiss}>Skip rating</text>
    </box>
  ),
  fallback: 0, // Return 0 if dismissed via ESC/backdrop
});
```

### `useDialog()` Hook

Returns dialog actions for imperatively controlling dialogs.

```tsx
const dialog = useDialog();

// Show a dialog (content must be a function for both React and Solid)
dialog.show({
  content: () => <MyContent />,
  size: "medium",
  style: { backgroundColor: "#1a1a1a" },
  unstyled: false,
  backdropColor: "#000000",
  backdropOpacity: 0.5,
  closeOnEscape: true,
  closeOnClickOutside: true,
  onClose: () => {},
  onOpen: () => {},
  id: "my-dialog",
});

// Close dialogs
dialog.close();        // Close top-most
dialog.close(id);      // Close specific
dialog.closeAll();     // Close all
dialog.replace({...}); // Close all and show new

// Async prompt methods
const confirmed = await dialog.confirm({ content: ... });
const value = await dialog.prompt<string>({ content: ... });
await dialog.alert({ content: ... });
const choice = await dialog.choice<"a" | "b">({ content: ... });
```

### `useDialogState()` Hook

Subscribe to reactive dialog state using a selector.

```typescript
interface DialogState {
  isOpen: boolean; // Whether any dialog is open
  count: number; // Number of open dialogs
  dialogs: readonly Dialog[]; // All active dialogs (oldest first)
  topDialog: Dialog | undefined; // The top-most dialog
}

const isOpen = useDialogState((s) => s.isOpen);
const count = useDialogState((s) => s.count);
const topDialog = useDialogState((s) => s.topDialog);
```

> [!WARNING]
> Always select primitives not new objects.

```ts
// Good - selects primitives
const isOpen = useDialogState((s) => s.isOpen);
const count = useDialogState((s) => s.count);

// Bad - creates new object every time, always re-renders
const state = useDialogState((s) => ({ isOpen: s.isOpen, count: s.count }));
```

**Key difference:** React returns values directly, Solid returns accessors you must call.

```tsx
// React - values directly
if (isOpen) {
  console.log(`${count} dialog(s) open`);
}

// Solid - call accessors
if (isOpen()) {
  console.log(`${count()} dialog(s) open`);
}
```

### `useDialogKeyboard()` Hook

When using `useKeyboard` from `@opentui/react` or `@opentui/solid` inside dialog content, keyboard events fire for **all** stacked dialogs simultaneously. This is because `useKeyboard` registers global listeners with no focus scoping.

`useDialogKeyboard` solves this by only firing the handler when the dialog is the topmost in the stack:

```tsx
import { useDialogKeyboard, type ConfirmContext } from "@opentui-ui/dialog/react";

function DeleteConfirmDialog({ resolve, dialogId }: ConfirmContext) {
  const [selected, setSelected] = useState<"cancel" | "delete">("cancel");

  // Only fires when THIS dialog is topmost
  useDialogKeyboard((key) => {
    if (key.name === "tab") {
      setSelected((prev) => (prev === "cancel" ? "delete" : "cancel"));
    }
    if (key.name === "return") {
      resolve(selected === "delete");
    }
    if (key.name === "escape") {
      resolve(false);
    }
  }, dialogId);

  return (
    <box flexDirection="column">
      <text>Delete this file?</text>
      <box flexDirection="row" gap={1}>
        <text bg={selected === "cancel" ? "#333" : undefined}>Cancel</text>
        <text bg={selected === "delete" ? "#c00" : undefined}>Delete</text>
      </box>
    </box>
  );
}
```

#### Manual Implementation with `dialogId`

If you need more control, use `dialogId` with `useDialogState` and the standard `useKeyboard` hook:

```tsx
import { useKeyboard } from "@opentui/react";
import { useDialogState, type ConfirmContext } from "@opentui-ui/dialog/react";

function MyDialog({ resolve, dialogId }: ConfirmContext) {
  // Reactively check if this dialog is topmost
  const isTopmost = useDialogState((s) => s.topDialog?.id === dialogId);

  useKeyboard((key) => {
    // Guard: only handle events when topmost
    if (!isTopmost) return;

    if (key.name === "return") {
      resolve(true);
    }
  });

  return <text>Press Enter to confirm</text>;
}
```

### Full Example

```tsx
// React (content must be a function)
function MyContent() {
  const dialog = useDialog();
  const isOpen = useDialogState((s) => s.isOpen);

  return (
    <box>
      <text>{isOpen ? "Dialog open" : "No dialog"}</text>
      <box onMouseUp={() => dialog.show({ content: () => <text>Hello!</text> })}>
        <text>Open Dialog</text>
      </box>
    </box>
  );
}

// Solid - note: content is a function, accessors are called
function MyContent() {
  const dialog = useDialog();
  const isOpen = useDialogState((s) => s.isOpen);

  return (
    <box>
      <text>{isOpen() ? "Dialog open" : "No dialog"}</text>
      <box
        onMouseUp={() => dialog.show({ content: () => <text>Hello!</text> })}
      >
        <text>Open Dialog</text>
      </box>
    </box>
  );
}
```

---

## Customization

These options work with both core and framework usage.

### Default Styling

Out of the box, dialogs use the **minimal** theme:

- Lighter backdrop (35% opacity)
- No borders
- Tighter padding (1 cell all around)

This provides a clean, unobtrusive appearance while still being usable immediately.

### Themes

Theme presets provide alternative visual styles. Import from `@opentui-ui/dialog/themes`:

```ts
import { DialogContainerRenderable, DialogManager } from "@opentui-ui/dialog";
import { themes } from "@opentui-ui/dialog/themes";

const container = new DialogContainerRenderable(renderer, {
  manager,
  ...themes.unstyled, // Start from scratch with no default styles
});
```

| Theme | Description |
| ----- | ----------- |
| `minimal` | Lighter backdrop (35%), no borders, tighter padding (default) |
| `unstyled` | No backdrop, no background, no border, no padding |

Customize a theme:

```ts
const container = new DialogContainerRenderable(renderer, {
  manager,
  ...themes.minimal,
  size: "large", // Override specific options
});
```

### Unstyled Mode

For full control over dialog styling, use `unstyled: true`. This disables all default styles (backdrop, background, border, padding):

```ts
const container = new DialogContainerRenderable(renderer, {
  manager,
  unstyled: true,
  dialogOptions: {
    style: {
      // Add your own styles
      backgroundColor: "#262626",
      border: true,
      borderColor: "#525252",
    },
  },
});
```

### Size Presets

Default size presets (in terminal columns):

| Size   | Width              |
| ------ | ------------------ |
| small  | 40                 |
| medium | 60                 |
| large  | 80                 |
| full   | terminal width - 4 |

Override with `sizePresets` option:

```ts
const container = new DialogContainerRenderable(renderer, {
  manager,
  sizePresets: {
    small: 35,
    medium: 55,
    large: 75,
  },
});
```

---

## TypeScript

Full TypeScript support with exported types:

```ts
// Core types
import type {
  // Dialog types
  Dialog,
  DialogContainerOptions,
  DialogContentFactory,
  DialogId,
  DialogShowOptions,
  DialogSize,
  DialogState,
  DialogStyle,
  DialogTheme,
  DialogToClose,
  // Async prompt contexts
  AlertContext,
  ChoiceContext,
  ConfirmContext,
  PromptContext,
  // Async dialog options (for imperative usage)
  AlertOptions,
  ChoiceOptions,
  ConfirmOptions,
  PromptOptions,
  // Base types (for building custom adapters)
  AsyncDialogOptions,
  BaseAlertOptions,
  BaseChoiceOptions,
  BaseConfirmOptions,
  BaseDialogActions,
  BasePromptOptions,
} from "@opentui-ui/dialog";

// Type guard for close events
import { isDialogToClose } from "@opentui-ui/dialog";

// Themes and default style constants
import {
  DEFAULT_BACKDROP_COLOR,
  DEFAULT_BACKDROP_OPACITY,
  DEFAULT_PADDING,
  DEFAULT_STYLE,
  themes,
  type DialogTheme,
} from "@opentui-ui/dialog/themes";
```

## License

MIT
