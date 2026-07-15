<div align="center">
  <img width="512" src="https://github.com/tuiparts/tuiparts/raw/main/packages/toast/assets/banner.png" />
</div>

<br />

<div align="center"><strong>A beautiful toast library for terminal UIs built on OpenTUI</strong></div>
<div align="center">
  <sub>Built by <a href="https://x.com/msmps_">Matt Simpson</a> | Inspired by <a href="https://sonner.emilkowal.ski/">Sonner</a></sub>
</div>

<br />

## Installation

```bash
bun add @tuiparts/toast
```

## Quick Start

```ts
import { toast, ToasterRenderable } from "@tuiparts/toast";

// 1. Add the toaster to your app (one line!)
ctx.root.add(new ToasterRenderable(ctx));

// 2. Show toasts from anywhere!
toast("Hello World");
```

That's it! No providers, no context, no configuration required.

## Quick Reference

```ts
// Toast Types
toast("message");           // default
toast.success("message");   // green checkmark
toast.error("message");     // red X
toast.warning("message");   // yellow warning
toast.info("message");      // blue info
toast.loading("message");   // animated spinner

// Common Patterns
toast("msg", { description: "details" }); // Two-line toast
toast("msg", { duration: Infinity });     // Persistent (manual dismiss)
toast("msg", { action: { label: "Undo", onClick: fn } }); // With button

// Dismiss
const id = toast("Hello");
toast.dismiss(id);  // Dismiss one
toast.dismiss();    // Dismiss all

// Update existing toast
const id = toast.loading("Uploading...");
toast.success("Done!", { id }); // Updates in place
```

## Toast Types

```ts
toast("Default notification");
toast.success("Operation completed!");
toast.error("Something went wrong");
toast.warning("Please check your input");
toast.info("Did you know?");
toast.loading("Processing...");
```

## With Descriptions

```ts
toast.success("File uploaded", {
  description: "Your file has been saved to the cloud",
});
```

## Promise Toast

The `toast.promise()` API automatically shows loading, success, and error states:

```ts
toast.promise(fetchData(), {
  loading: "Fetching data...",
  success: "Data loaded successfully!",
  error: "Failed to load data",
});

// With dynamic messages
toast.promise(saveUser(data), {
  loading: "Saving user...",
  success: (user) => `${user.name} has been saved`,
  error: (err) => `Error: ${err.message}`,
});
```

## Actions

Add interactive buttons to your toasts:

```ts
toast("File deleted", {
  action: {
    label: "Undo",
    onClick: () => restoreFile(),
  },
});
```

## Updating Toasts

Update an existing toast by passing its ID:

```ts
const id = toast.loading("Uploading...");

// Later...
toast.success("Upload complete!", { id });

// Or on error
toast.error("Upload failed", { id });
```

## Dismissing Toasts

```ts
// Dismiss a specific toast
const id = toast("Hello");
toast.dismiss(id);

// Dismiss all toasts
toast.dismiss();
```

## Duration

### Duration Presets

Use the built-in `TOAST_DURATION` presets for consistent, readable duration values:

```ts
import { toast, TOAST_DURATION } from "@tuiparts/toast";

// Quick confirmation (2s)
toast.success("Copied!", { duration: TOAST_DURATION.SHORT });

// Standard duration (4s) - this is the default
toast("Hello", { duration: TOAST_DURATION.DEFAULT });

// Important message (6s)
toast.warning("Check your settings", { duration: TOAST_DURATION.LONG });

// Critical information (10s)
toast.error("Connection lost", { duration: TOAST_DURATION.EXTENDED });

// Manual dismiss only
toast.info("Click to continue", { duration: TOAST_DURATION.PERSISTENT });
```

### Duration Preset Values

| Preset       | Duration | Use Case                  |
| ------------ | -------- | ------------------------- |
| `SHORT`      | 2000ms   | Brief confirmations       |
| `DEFAULT`    | 4000ms   | Standard notifications    |
| `LONG`       | 6000ms   | Important messages        |
| `EXTENDED`   | 10000ms  | Critical information      |
| `PERSISTENT` | Infinity | Requires manual dismissal |

### Custom Duration

You can also pass any number in milliseconds:

```ts
// Custom duration (in milliseconds)
toast("This disappears in 10 seconds", {
  duration: 10000,
});

// Persistent toast (won't auto-dismiss)
toast("I'll stay until dismissed", {
  duration: Infinity,
});
```

## Themes

Optional theme presets are available via a separate import. These override the built-in defaults with alternative visual styles.

```ts
import { ToasterRenderable } from "@tuiparts/toast";
import { minimal } from "@tuiparts/toast/themes";

const toaster = new ToasterRenderable(ctx, minimal);
```

### Available Themes

| Theme        | Description                       |
| ------------ | --------------------------------- |
| `minimal`    | Clean and unobtrusive, no borders |
| `monochrome` | Grayscale only, no colors         |

### Customizing Themes

Spread a theme and override specific options:

```ts
import { minimal } from "@tuiparts/toast/themes";

const toaster = new ToasterRenderable(ctx, {
  ...minimal,
  position: "bottom-right",
  stackingMode: "stack",
});
```

### Theme Utilities

```ts
import { themes } from "@tuiparts/toast/themes";

// Access all themes
themes.minimal;
themes.monochrome;
```

### Theme Types

```ts
import type { ToasterTheme } from "@tuiparts/toast/themes";
```

## Toaster Configuration

Customize the toaster appearance and behavior:

```ts
const toaster = new ToasterRenderable(ctx, {
  // Position on screen
  position: "bottom-right", // 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

  // Gap between toasts (terminal rows)
  gap: 1,

  // How to handle multiple toasts
  stackingMode: "single", // 'single' | 'stack'

  // Max visible toasts in stack mode
  visibleToasts: 3,

  // Show close button on toasts
  closeButton: false,

  // Maximum width for toasts
  maxWidth: 60,

  // Offset from screen edges
  offset: {
    top: 1,
    right: 2,
    bottom: 1,
    left: 2,
  },

  // Custom icons
  icons: {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
    loading: "◌",
    close: "×",
  },

  // Toast styling and duration options
  toastOptions: {
    style: {
      /* base styles */
    },
    duration: 4000,
    success: {
      style: {
        /* overrides */
      },
      duration: 3000,
    },
    // ... other types
  },
});
```

### ToasterOptions Reference

| Option          | Type                           | Default                                    | Description                                                  |
| --------------- | ------------------------------ | ------------------------------------------ | ------------------------------------------------------------ |
| `position`      | `Position`                     | `"bottom-right"`                           | Position on screen                                           |
| `gap`           | `number`                       | `1`                                        | Gap between toasts (terminal rows)                           |
| `stackingMode`  | `StackingMode`                 | `"single"`                                 | How to handle multiple toasts: `"single"` or `"stack"`       |
| `visibleToasts` | `number`                       | `3`                                        | Max visible toasts in stack mode                             |
| `closeButton`   | `boolean`                      | `false`                                    | Show close button on toasts                                  |
| `maxWidth`      | `number`                       | `60`                                       | Maximum width for toasts (terminal columns)                  |
| `offset`        | `ToasterOffset`                | `{ top: 1, right: 2, bottom: 1, left: 2 }` | Offset from screen edges                                     |
| `icons`         | `Partial<ToastIcons> \| false` | -                                          | Custom icons for each toast type, or `false` to disable      |
| `toastOptions`  | `ToastOptions`                 | -                                          | Default toast options (styles, duration, per-type overrides) |

## Styling

Configure toast styles using the `toastOptions` prop:

```ts
const toaster = new ToasterRenderable(ctx, {
  toastOptions: {
    // Base styles applied to all toasts
    style: {
      backgroundColor: "#1a1a1a",
      foregroundColor: "#ffffff",
      borderColor: "#333333",
      borderStyle: "rounded", // 'single' | 'double' | 'rounded' | 'heavy'
      paddingX: 1,
      paddingY: 0,
    },
    // Default duration for all toasts
    duration: 4000,
    // Per-type overrides
    success: {
      style: { borderColor: "#22c55e" },
      duration: 3000,
    },
    error: {
      style: { borderColor: "#ef4444" },
      duration: 6000,
    },
    warning: {
      style: { borderColor: "#f59e0b" },
    },
    info: {
      style: { borderColor: "#3b82f6" },
    },
    loading: {
      style: { borderColor: "#6b7280" },
    },
  },
});
```

### ToastStyle Reference

| Property            | Type                       | Default     | Description                                                                                 |
| ------------------- | -------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `border`            | `boolean \| BorderSides[]` | `true`      | Border configuration. `true` = all sides, `false` = none, or array like `["left", "right"]` |
| `borderColor`       | `string`                   | `"#333333"` | Border color (hex, rgb, or named)                                                           |
| `borderStyle`       | `BorderStyle`              | `"single"`  | Border style: `"single"` \| `"double"` \| `"rounded"` \| `"heavy"`                          |
| `customBorderChars` | `BorderCharacters`         | -           | Custom border characters (overrides `borderStyle`)                                          |
| `minHeight`         | `number`                   | `3`         | Minimum height in terminal rows                                                             |
| `maxWidth`          | `number`                   | -           | Maximum width in terminal columns                                                           |
| `minWidth`          | `number`                   | -           | Minimum width in terminal columns                                                           |
| `padding`           | `number`                   | -           | Uniform padding (all sides)                                                                 |
| `paddingX`          | `number`                   | `1`         | Horizontal padding (left + right)                                                           |
| `paddingY`          | `number`                   | `0`         | Vertical padding (top + bottom)                                                             |
| `paddingTop`        | `number`                   | -           | Top padding                                                                                 |
| `paddingBottom`     | `number`                   | -           | Bottom padding                                                                              |
| `paddingLeft`       | `number`                   | -           | Left padding                                                                                |
| `paddingRight`      | `number`                   | -           | Right padding                                                                               |
| `backgroundColor`   | `string`                   | `"#1a1a1a"` | Background color                                                                            |
| `foregroundColor`   | `string`                   | `"#ffffff"` | Text/foreground color                                                                       |
| `mutedColor`        | `string`                   | `"#6b7280"` | Muted text color (for descriptions)                                                         |
| `iconColor`         | `string`                   | -           | Icon color (defaults to `borderColor`)                                                      |

### Custom Border Characters

For full control over border rendering, use `customBorderChars` to define each border character:

```ts
const toaster = new ToasterRenderable(ctx, {
  toastOptions: {
    style: {
      border: ["left", "right"],
      customBorderChars: {
        topLeft: "",
        topRight: "",
        bottomLeft: "",
        bottomRight: "",
        horizontal: " ",
        vertical: "┃",
        topT: "",
        bottomT: "",
        leftT: "",
        rightT: "",
        cross: "",
      },
    },
  },
});
```

This is useful for creating unique border styles, like a vertical bar accent:

```ts
// Vertical bar on left and right only
border: ["left", "right"],
customBorderChars: {
  vertical: "┃",
  // Other characters can be empty strings
  topLeft: "", topRight: "", bottomLeft: "", bottomRight: "",
  horizontal: " ", topT: "", bottomT: "", leftT: "", rightT: "", cross: "",
},
```

### Per-Toast Styles

Override styles on individual toasts:

```ts
toast.success("Custom styled!", {
  style: {
    borderColor: "#8b5cf6",
    backgroundColor: "#1e1b4b",
  },
});
```

## Icon Sets

Choose from built-in icon sets based on terminal capabilities:

```ts
import {
  DEFAULT_ICONS, // Unicode icons (default)
  ASCII_ICONS, // ASCII-only for limited terminals
  MINIMAL_ICONS, // Single character icons
  EMOJI_ICONS, // Emoji icons
} from "@tuiparts/toast";

// Use ASCII icons for terminals with limited Unicode support
const toaster = new ToasterRenderable(ctx, {
  icons: ASCII_ICONS,
});

// Use emoji icons for terminals with good emoji support
const toaster = new ToasterRenderable(ctx, {
  icons: EMOJI_ICONS,
});
```

### Custom Loading Spinner

The `loading` icon can be either a static string or an animated spinner configuration:

```ts
const toaster = new ToasterRenderable(ctx, {
  icons: {
    // Static loading icon (no animation)
    loading: "...",

    // Or animated spinner
    loading: {
      frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
      interval: 80,
    },
  },
});
```

Some spinner examples:

```ts
// Dots spinner
{ frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"], interval: 80 }

// Circle spinner (default)
{ frames: ["◜", "◠", "◝", "◞", "◡", "◟"], interval: 100 }

// Simple ASCII spinner
{ frames: ["-", "\\", "|", "/"], interval: 100 }

// Bouncing bar
{ frames: ["[    ]", "[=   ]", "[==  ]", "[=== ]", "[ ===]", "[  ==]", "[   =]", "[    ]"], interval: 120 }
```

### Disabling Icons

To disable icons entirely, set `icons: false`:

```ts
const toaster = new ToasterRenderable(ctx, {
  icons: false,
});
```

Individual toasts can still override this by providing a custom `icon`:

```ts
// Icons are disabled globally, but this toast will show a custom icon
toast.success("Done!", { icon: "✓" });
```

## API Reference

### `toast(message, options?)`

Show a default toast.

### `toast.success(message, options?)`

Show a success toast with a checkmark icon.

### `toast.error(message, options?)`

Show an error toast with an X icon.

### `toast.warning(message, options?)`

Show a warning toast with a warning icon.

### `toast.info(message, options?)`

Show an info toast with an info icon.

### `toast.loading(message, options?)`

Show a loading toast with an animated spinner.

### `toast.promise(promise, options)`

Show a toast that updates based on promise state.

### `toast.dismiss(id?)`

Dismiss a specific toast by ID, or all toasts if no ID provided.

### `toast.getToasts()`

Get all currently active toasts.

### `toast.getHistory()`

Get all toasts ever created (including dismissed).

### Toast Options

| Option        | Type                       | Default    | Description                        |
| ------------- | -------------------------- | ---------- | ---------------------------------- |
| `id`          | `string \| number`         | auto       | Unique identifier for the toast    |
| `description` | `string \| (() => string)` | -          | Secondary text below the title     |
| `duration`    | `number`                   | `4000`     | Time in ms before auto-dismiss     |
| `dismissible` | `boolean`                  | `true`     | Whether the toast can be dismissed |
| `icon`        | `string`                   | type-based | Custom icon to display             |
| `action`      | `{ label, onClick }`       | -          | Action button configuration        |
| `closeButton` | `boolean`                  | `false`    | Show close button                  |
| `style`       | `ToastStyle`               | -          | Per-toast style overrides          |
| `onDismiss`   | `(toast) => void`          | -          | Callback when dismissed            |
| `onAutoClose` | `(toast) => void`          | -          | Callback when auto-closed          |

## Examples

### Basic Example

```ts
import { createCliRenderer } from "@opentui/core";
import { toast, ToasterRenderable } from "@tuiparts/toast";

const renderer = await createCliRenderer();

// Add toaster
const toaster = new ToasterRenderable(renderer, {
  position: "bottom-right",
});
renderer.root.add(toaster);

// Show some toasts
toast.success("Application started!");

setTimeout(() => {
  toast.info("Press 'q' to quit");
}, 1000);
```

### Async Operation

```ts
async function saveData(data: unknown) {
  toast.promise(
    fetch("/api/save", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    {
      loading: "Saving...",
      success: "Saved!",
      error: "Failed to save",
    }
  );
}
```

### Manual Loading State

```ts
async function uploadFile(file: File) {
  const id = toast.loading("Uploading...");

  try {
    const result = await upload(file);
    toast.success(`Uploaded ${result.filename}`, { id });
  } catch (error) {
    toast.error("Upload failed", { id });
  }
}
```

## React

For React applications, use the `Toaster` component and `useToasts` hook:

```tsx
import { Toaster, useToasts, toast } from "@tuiparts/toast/react";

function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <MyComponent />
    </>
  );
}

function MyComponent() {
  const { toasts } = useToasts();

  useKeyboard((key) => {
    if (key.name === "1") {
      toast.success("Hello World");
    }
  });

  return (
    <box>
      <text>Active toasts: {toasts.length}</text>
    </box>
  );
}
```

The `useToasts` hook provides **reactive access** to the current toast state, re-rendering your component whenever toasts are added, updated, or dismissed.

## Solid

For Solid applications, use the `Toaster` component and `useToasts` hook:

```tsx
import { Toaster, useToasts, toast } from "@tuiparts/toast/solid";

function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <MyComponent />
    </>
  );
}

function MyComponent() {
  const toasts = useToasts();

  useKeyboard((key) => {
    if (key.name === "1") {
      toast.success("Hello World");
    }
  });

  return (
    <box>
      <text>Active toasts: {toasts().length}</text>
    </box>
  );
}
```

The `useToasts` hook returns a **reactive accessor** that updates whenever toasts change. Call it as a function (`toasts()`) to access the current array.

## TypeScript

Full TypeScript support with exported types:

```ts
import type {
  Action,           // Action button configuration
  ExternalToast,    // Options for toast() calls
  Position,         // Toaster position type
  PromiseData,      // Configuration for toast.promise()
  SpinnerConfig,    // Animated spinner configuration { frames, interval }
  StackingMode,     // Stacking mode ('single' | 'stack')
  ToasterOffset,    // Offset configuration for positioning
  ToasterOptions,   // Configuration for ToasterRenderable
  ToastIcons,       // Custom icon set type
  ToastOptions,     // Default toast options (styles, duration, per-type overrides)
  ToastStyle,       // Per-toast styling options
  ToastType,        // Toast type variants
  TypeToastOptions, // Per-type options (style + duration)
} from "@tuiparts/toast";

// Border types (for customBorderChars) come from @opentui/core
import type { BorderCharacters, BorderSides, BorderStyle } from "@opentui/core";

// Type guards
import { isAction, isSpinnerConfig } from "@tuiparts/toast";
```

### Constants

```ts
import { TOAST_DURATION } from "@tuiparts/toast";

// Duration presets
TOAST_DURATION.SHORT;      // 2000ms - brief confirmations
TOAST_DURATION.DEFAULT;    // 4000ms - standard notifications
TOAST_DURATION.LONG;       // 6000ms - important messages
TOAST_DURATION.EXTENDED;   // 10000ms - critical information
TOAST_DURATION.PERSISTENT; // Infinity - manual dismiss only
```

## Acknowledgments

Inspired by [Sonner](https://sonner.emilkowal.ski/) by Emil Kowalski.

## License

MIT
