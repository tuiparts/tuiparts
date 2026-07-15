/** @jsxImportSource @opentui/solid */

import {
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";
import {
  createComponent,
  Portal,
  useKeyboard,
  useRenderer,
  useTerminalDimensions,
} from "@opentui/solid";
import {
  type Accessor,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  onCleanup,
  type ParentProps,
  useContext,
} from "solid-js";
import { JSX_CONTENT_KEY } from "./constants";
import { DialogManager } from "./manager";
import type {
  AlertContext,
  ChoiceContext,
  ConfirmContext,
  DialogState,
  PromptContext,
} from "./prompts";
import { DialogContainerRenderable } from "./renderables";
import type {
  BaseAlertOptions,
  BaseChoiceOptions,
  BaseConfirmOptions,
  BaseDialogActions,
  BasePromptOptions,
  Dialog,
  DialogContainerOptions,
  DialogId,
  DialogShowOptions,
  DialogToClose,
  InternalDialog,
  InternalDialogShowOptions,
} from "./types";

/** Function returning JSX. Required because Solid JSX is eagerly evaluated. */
export type ContentAccessor = () => JSX.Element;

interface DialogWithJsx extends InternalDialog {
  [JSX_CONTENT_KEY]?: ContentAccessor;
}

/** Internal type for show options that include JSX bridging keys */
interface DialogShowOptionsWithJsx extends InternalDialogShowOptions {
  [JSX_CONTENT_KEY]?: ContentAccessor;
}

interface PortalItem {
  id: string | number;
  contentAccessor: ContentAccessor;
  mount: BoxRenderable;
}

export interface ShowOptions extends Omit<DialogShowOptions, "content"> {
  /** Must be a function returning JSX: `() => <text>Hi</text>` */
  content: ContentAccessor;
}

// ============================================================================
// Solid Prompt Types
// ============================================================================
// These extend the generic base types with Solid-specific content signatures.

/** Content factory for prompt dialogs. */
type PromptContent<T> = (ctx: PromptContext<T>) => ContentAccessor;

/** Content factory for confirm dialogs. */
type ConfirmContent = (ctx: ConfirmContext) => ContentAccessor;

/** Content factory for alert dialogs. */
type AlertContent = (ctx: AlertContext) => ContentAccessor;

/** Content factory for choice dialogs. */
type ChoiceContent<K> = (ctx: ChoiceContext<K>) => ContentAccessor;

/**
 * Options for a generic prompt dialog.
 * @template T The type of value the prompt resolves to.
 */
export interface PromptOptions<T>
  extends BasePromptOptions<T, PromptContent<T>> {}

/**
 * Options for a confirm dialog.
 */
export interface ConfirmOptions extends BaseConfirmOptions<ConfirmContent> {}

/**
 * Options for an alert dialog.
 */
export interface AlertOptions extends BaseAlertOptions<AlertContent> {}

/**
 * Options for a choice dialog.
 * @template K The type of keys for the available choices.
 */
export interface ChoiceOptions<K>
  extends BaseChoiceOptions<ChoiceContent<K>, K> {}

/**
 * Dialog actions for showing, closing, and managing dialogs.
 * Extends BaseDialogActions with async prompt methods.
 */
export interface DialogActions extends BaseDialogActions<ShowOptions> {
  /** Show a generic prompt dialog and wait for a response. */
  prompt: <T>(options: PromptOptions<T>) => Promise<T | undefined>;
  /** Show a confirmation dialog and wait for the user to confirm or cancel. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Show an alert dialog and wait for the user to dismiss it. */
  alert: (options: AlertOptions) => Promise<void>;
  /** Show a choice dialog and wait for the user to select an option. */
  choice: <K>(options: ChoiceOptions<K>) => Promise<K | undefined>;
}

interface DialogContextValue {
  manager: DialogManager;
  dialogs: Accessor<readonly Dialog[]>;
}

const DialogContext = createContext<DialogContextValue>();

const createPlaceholderContent = () => (ctx: RenderContext) =>
  new BoxRenderable(ctx, { id: "~jsx-placeholder" });

/**
 * Helper to build dialog show options for Solid adapter.
 * Handles both direct show/replace calls and async prompt methods.
 * Includes validation for ContentAccessor.
 *
 * @param content - ContentAccessor or (ctx) => ContentAccessor
 * @param rest - Dialog options excluding content
 * @param ctx - Optional context for async prompts (prompt, confirm, alert, choice)
 */
function buildShowOptions(
  content: ContentAccessor,
  rest: Omit<DialogShowOptions, "content">,
): DialogShowOptionsWithJsx;
function buildShowOptions<TCtx>(
  content: (ctx: TCtx) => ContentAccessor,
  rest: Omit<DialogShowOptions, "content">,
  ctx: TCtx,
): DialogShowOptionsWithJsx;
function buildShowOptions(
  content: ContentAccessor | ((...args: unknown[]) => unknown),
  rest: Omit<DialogShowOptions, "content">,
  ctx?: unknown,
): DialogShowOptionsWithJsx {
  const contentAccessor =
    ctx !== undefined
      ? (content as (ctx: unknown) => ContentAccessor)(ctx)
      : (content as ContentAccessor);

  validateContentAccessor(contentAccessor);

  return {
    ...rest,
    content: createPlaceholderContent(),
    [JSX_CONTENT_KEY]: contentAccessor,
  } as DialogShowOptionsWithJsx;
}

function validateContentAccessor(
  content: unknown,
): asserts content is ContentAccessor {
  if (typeof content !== "function") {
    throw new Error(
      `[@tuiparts/dialog/solid] Invalid content type: expected a function returning JSX, but received ${typeof content}.\n\n` +
        `Solid.js JSX is eagerly evaluated, so you must wrap content in a function:\n\n` +
        `  // CORRECT\n` +
        `  dialog.show({ content: () => <text>Hello</text> })\n\n` +
        `  // WRONG - JSX evaluated immediately, before dialog context exists\n` +
        `  dialog.show({ content: <text>Hello</text> })\n\n` +
        `See: https://github.com/tuiparts/tuiparts for more information.`,
    );
  }
}

function useDialogContext(): DialogContextValue {
  const ctx = useContext(DialogContext);

  if (!ctx) {
    throw new Error(
      "useDialog/useDialogState must be used within a DialogProvider.\n\n" +
        "Wrap your app with <DialogProvider>:\n\n" +
        "  import { DialogProvider } from '@tuiparts/dialog/solid';\n\n" +
        "  function App() {\n" +
        "    return (\n" +
        "      <DialogProvider>\n" +
        "        <YourContent />\n" +
        "      </DialogProvider>\n" +
        "    );\n" +
        "  }",
    );
  }

  return ctx;
}

/**
 * Access dialog actions within a DialogProvider.
 *
 * For reactive state, use `useDialogState()` instead.
 *
 * @example
 * ```tsx
 * const dialog = useDialog();
 *
 * // Show a dialog (content must be a function returning JSX)
 * dialog.show({ content: () => <text>Hello</text> });
 *
 * // Close the top dialog
 * dialog.close();
 *
 * // Close a specific dialog
 * dialog.close(dialogId);
 *
 * // Close all dialogs
 * dialog.closeAll();
 * ```
 */
export function useDialog(): DialogActions {
  const { manager } = useDialogContext();

  return {
    show: (options: ShowOptions) => {
      const { content, ...rest } = options;
      return manager.show(buildShowOptions(content, rest));
    },

    close: (id?: DialogId) => manager.close(id),
    closeAll: () => manager.closeAll(),

    replace: (options: ShowOptions) => {
      const { content, ...rest } = options;
      return manager.replace(buildShowOptions(content, rest));
    },

    // =====================================================================
    // Async Prompt Methods (delegate to manager with factory pattern)
    // =====================================================================

    prompt: <T,>(options: PromptOptions<T>): Promise<T | undefined> => {
      const { content, fallback, ...rest } = options;
      return manager.prompt<T>((ctx) => ({
        ...buildShowOptions(content, rest, ctx),
        fallback,
      }));
    },

    confirm: (options: ConfirmOptions): Promise<boolean> => {
      const { content, fallback, ...rest } = options;
      return manager.confirm((ctx) => ({
        ...buildShowOptions(content, rest, ctx),
        fallback,
      }));
    },

    alert: (options: AlertOptions): Promise<void> => {
      const { content, ...rest } = options;
      return manager.alert((ctx) => buildShowOptions(content, rest, ctx));
    },

    choice: <K,>(options: ChoiceOptions<K>): Promise<K | undefined> => {
      const { content, fallback, ...rest } = options;
      return manager.choice<K>((ctx) => ({
        ...buildShowOptions(content, rest, ctx),
        fallback,
      }));
    },
  };
}

/**
 * Subscribe to reactive dialog state with a selector.
 *
 * Returns an accessor that tracks in effects/memos. The selector
 * is called inside a memo, so only the selected value is tracked.
 *
 * @example
 * ```tsx
 * // Subscribe to specific state - returns an accessor
 * const isOpen = useDialogState(s => s.isOpen);
 * const count = useDialogState(s => s.count);
 * const topDialog = useDialogState(s => s.topDialog);
 * const dialogs = useDialogState(s => s.dialogs);
 *
 * // Use in effects - tracks automatically
 * createEffect(() => {
 *   if (isOpen()) {
 *     console.log(`${count()} dialog(s) open`);
 *   }
 * });
 *
 * // Use in JSX - tracks automatically
 * <Show when={isOpen()}>
 *   <text>{count()} dialogs open</text>
 * </Show>
 * ```
 */
export function useDialogState<T>(
  selector: (state: DialogState) => T,
): Accessor<T> {
  const { dialogs } = useDialogContext();

  return createMemo(() => {
    const d = dialogs();
    const state: DialogState = {
      isOpen: d.length > 0,
      dialogs: d,
      topDialog: d.length > 0 ? d[d.length - 1] : undefined,
      count: d.length,
    };
    return selector(state);
  });
}

/**
 * A keyboard hook for dialog content that only fires when the dialog is topmost.
 *
 * This prevents keyboard events from affecting stacked dialogs that are not focused.
 * Use this instead of `useKeyboard` inside dialog content components.
 *
 * @param handler - Keyboard event handler (only called when dialog is topmost)
 * @param dialogId - The dialog's ID from context (e.g., `ctx.dialogId`)
 *
 * @example
 * ```tsx
 * function DeleteConfirmDialog(props: ConfirmContext) {
 *   useDialogKeyboard((key) => {
 *     if (key.name === "return") props.resolve(true);
 *     if (key.name === "escape") props.resolve(false);
 *   }, props.dialogId);
 *
 *   return () => <text>Press Enter to confirm</text>;
 * }
 * ```
 */
export function useDialogKeyboard(
  handler: (key: KeyEvent) => void | Promise<void>,
  dialogId: DialogId,
): void {
  const isTopmost = useDialogState((s) => s.topDialog?.id === dialogId);

  useKeyboard((key) => {
    if (isTopmost()) {
      handler(key);
    }
  });
}

export interface DialogProviderProps extends DialogContainerOptions {}

/**
 * Provides dialog functionality to children via useDialog() and useDialogState() hooks.
 *
 * @example
 * ```tsx
 * <DialogProvider size="medium">
 *   <App />
 * </DialogProvider>
 * ```
 */
export function DialogProvider(props: ParentProps<DialogProviderProps>) {
  const renderer = useRenderer();
  const dimensions = useTerminalDimensions();

  const manager = new DialogManager(renderer);

  const container = new DialogContainerRenderable(renderer, {
    manager,
    size: props.size,
    dialogOptions: props.dialogOptions,
    sizePresets: props.sizePresets,
    closeOnEscape: props.closeOnEscape,
    closeOnClickOutside: props.closeOnClickOutside,
    backdropColor: props.backdropColor,
    backdropOpacity: props.backdropOpacity,
    unstyled: props.unstyled,
  });
  renderer.root.add(container);

  // Reactive signal for dialog state - drives both useDialogState() reactivity and portal rendering
  const [dialogs, setDialogs] = createSignal<readonly Dialog[]>([]);

  let disposed = false;

  // Cache maintains stable references for <For> to preserve component state
  const portalItemCache = new Map<string | number, PortalItem>();

  // Bridge renderable layer to Solid's reactive system
  const unsubscribe = manager.subscribe((_data: Dialog | DialogToClose) => {
    queueMicrotask(() => {
      if (!disposed) {
        setDialogs(manager.getDialogs());
      }
    });
  });

  onCleanup(() => {
    disposed = true;
    unsubscribe();
    portalItemCache.clear();
    renderer.root.remove(container);
    container.destroyRecursively();
    manager.destroy();
  });

  createEffect(() => {
    const dims = dimensions();
    container.updateDimensions(dims.width);
  });

  const portalItems = createMemo((): PortalItem[] => {
    // Track dialogs signal to update when dialogs change
    dialogs();

    const items: PortalItem[] = [];
    const dialogRenderables = container.getDialogRenderables();

    for (const [id, dialogRenderable] of dialogRenderables) {
      const dialogWithJsx = dialogRenderable.dialog as DialogWithJsx;
      const contentAccessor = dialogWithJsx[JSX_CONTENT_KEY];

      if (contentAccessor !== undefined) {
        const cached = portalItemCache.get(id);
        const shouldUpdateCachedItem =
          !cached || cached.mount !== dialogRenderable;

        const item: PortalItem = shouldUpdateCachedItem
          ? { id, contentAccessor, mount: dialogRenderable }
          : cached;

        if (shouldUpdateCachedItem) {
          portalItemCache.set(id, item);
        }

        items.push(item);
      }
    }

    return items;
  });

  createEffect(() => {
    // Track dialogs signal to clean cache when dialogs close
    dialogs();

    const dialogRenderables = container.getDialogRenderables();
    const activeIds = new Set(dialogRenderables.keys());

    for (const id of portalItemCache.keys()) {
      if (!activeIds.has(id)) {
        portalItemCache.delete(id);
      }
    }
  });

  // Context value includes both manager and reactive dialogs signal
  const contextValue: DialogContextValue = { manager, dialogs };

  // TODO! Refactor to JSX once @opentui/solid 'jsx' exports are fixed!
  return createComponent(DialogContext.Provider, {
    value: contextValue,
    get children() {
      return [
        // original {props.children}
        props.children,

        createComponent(For, {
          get each() {
            return portalItems();
          },
          children: (item: PortalItem) =>
            createComponent(Portal, {
              mount: item.mount,
              get children() {
                return item.contentAccessor();
              },
            }),
        }),
      ];
    },
  });
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type {
  AlertContext,
  ChoiceContext,
  ConfirmContext,
  DialogState,
  PromptContext,
} from "./prompts";
export { type DialogTheme, themes } from "./themes";
export type {
  DialogContainerOptions,
  DialogId,
  DialogSize,
  DialogStyle,
} from "./types";
