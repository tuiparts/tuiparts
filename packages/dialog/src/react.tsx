/** @jsxImportSource @opentui/react */

import {
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";
import {
  createPortal,
  useKeyboard,
  useRenderer,
  useTerminalDimensions,
} from "@opentui/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
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
  DialogContainerOptions,
  DialogId,
  DialogShowOptions,
  InternalDialog,
  InternalDialogShowOptions,
} from "./types";

interface DialogWithJsx extends InternalDialog {
  [JSX_CONTENT_KEY]?: ReactNode;
}

/** Internal type for show options that include JSX bridging keys */
interface DialogShowOptionsWithJsx extends InternalDialogShowOptions {
  [JSX_CONTENT_KEY]?: ReactNode;
}

/**
 * Content factory that returns React elements.
 * Must be a function to ensure consistent behavior with Solid adapter
 * and prevent timing issues with JSX evaluation.
 */
export type ContentFactory = () => ReactNode;

export interface ShowOptions extends Omit<DialogShowOptions, "content"> {
  /** Must be a function returning JSX: `() => <MyDialog />` */
  content: ContentFactory;
}

// ============================================================================
// React Prompt Types
// ============================================================================
// These extend the generic base types with React-specific content signatures.

/** Content factory for prompt dialogs. */
type PromptContent<T> = (ctx: PromptContext<T>) => ReactNode;

/** Content factory for confirm dialogs. */
type ConfirmContent = (ctx: ConfirmContext) => ReactNode;

/** Content factory for alert dialogs. */
type AlertContent = (ctx: AlertContext) => ReactNode;

/** Content factory for choice dialogs. */
type ChoiceContent<K> = (ctx: ChoiceContext<K>) => ReactNode;

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

const DialogContext = createContext<DialogManager | null>(null);

const createPlaceholderContent = () => (ctx: RenderContext) =>
  new BoxRenderable(ctx, { id: "~jsx-placeholder" });

/**
 * Helper to build dialog show options for React adapter.
 * Handles both direct show/replace calls and async prompt methods.
 *
 * @param content - () => ReactNode or (ctx) => ReactNode
 * @param rest - Dialog options excluding content
 * @param ctx - Optional context for async prompts (prompt, confirm, alert, choice)
 */
function buildShowOptions(
  content: ContentFactory,
  rest: Omit<DialogShowOptions, "content">,
): DialogShowOptionsWithJsx;
function buildShowOptions<TCtx>(
  content: (ctx: TCtx) => ReactNode,
  rest: Omit<DialogShowOptions, "content">,
  ctx: TCtx,
): DialogShowOptionsWithJsx;
function buildShowOptions(
  content: (...args: unknown[]) => unknown,
  rest: Omit<DialogShowOptions, "content">,
  ctx?: unknown,
): DialogShowOptionsWithJsx {
  const resolvedContent = ctx !== undefined ? content(ctx) : content();

  return {
    ...rest,
    content: createPlaceholderContent(),
    [JSX_CONTENT_KEY]: resolvedContent,
    deferred: true,
  } as DialogShowOptionsWithJsx;
}

function useDialogManager(): DialogManager {
  const manager = useContext(DialogContext);

  if (!manager) {
    throw new Error(
      "useDialog/useDialogState must be used within a DialogProvider.\n\n" +
        "Wrap your app with <DialogProvider>:\n\n" +
        "  import { DialogProvider } from '@opentui-ui/dialog/react';\n\n" +
        "  function App() {\n" +
        "    return (\n" +
        "      <DialogProvider>\n" +
        "        <YourContent />\n" +
        "      </DialogProvider>\n" +
        "    );\n" +
        "  }",
    );
  }

  return manager;
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
 * // Show a dialog (content must be a function)
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
  const manager = useDialogManager();

  return useMemo<DialogActions>(
    () => ({
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
    }),
    [manager],
  );
}

/**
 * Subscribe to reactive dialog state with a selector.
 *
 * Only re-renders when the selected value changes (using reference equality).
 *
 * @example
 * ```tsx
 * // Subscribe to specific state
 * const isOpen = useDialogState(s => s.isOpen);
 * const count = useDialogState(s => s.count);
 * const topDialog = useDialogState(s => s.topDialog);
 * const dialogs = useDialogState(s => s.dialogs);
 *
 * // Use in your component
 * if (isOpen) {
 *   console.log(`${count} dialog(s) open`);
 * }
 * ```
 */
export function useDialogState<T>(selector: (state: DialogState) => T): T {
  const manager = useDialogManager();

  const subscribe = useMemo(
    () => (onStoreChange: () => void) => manager.subscribe(onStoreChange),
    [manager],
  );

  const getSnapshot = useCallback(() => {
    const dialogs = manager.getDialogs();
    const state: DialogState = {
      isOpen: dialogs.length > 0,
      dialogs,
      topDialog: dialogs.length > 0 ? dialogs[dialogs.length - 1] : undefined,
      count: dialogs.length,
    };
    return selector(state);
  }, [manager, selector]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
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
 * function DeleteConfirmDialog({ resolve, dialogId }: ConfirmContext) {
 *   useDialogKeyboard((key) => {
 *     if (key.name === "return") resolve(true);
 *     if (key.name === "escape") resolve(false);
 *   }, dialogId);
 *
 *   return <text>Press Enter to confirm</text>;
 * }
 * ```
 */
export function useDialogKeyboard(
  handler: (key: KeyEvent) => void | Promise<void>,
  dialogId: DialogId,
): void {
  const isTopmost = useDialogState((s) => s.topDialog?.id === dialogId);

  useKeyboard((key) => {
    if (isTopmost) {
      handler(key);
    }
  });
}

export interface DialogProviderProps extends DialogContainerOptions {
  children: ReactNode;
}

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
export function DialogProvider(props: DialogProviderProps) {
  const { children, ...containerOptions } = props;

  const renderer = useRenderer();
  const dimensions = useTerminalDimensions();

  const [manager] = useState(() => new DialogManager(renderer));

  const [container] = useState(
    () =>
      new DialogContainerRenderable(renderer, {
        manager,
        ...containerOptions,
      }),
  );

  const dialogs = useSyncExternalStore(
    (onStoreChange) => manager.subscribe(onStoreChange),
    () => manager.getDialogs(),
    () => manager.getDialogs(),
  );

  useEffect(() => {
    renderer.root.add(container);

    return () => {
      renderer.root.remove(container);
      container.destroyRecursively();
      manager.destroy();
    };
  }, [container, manager, renderer]);

  useEffect(() => {
    container.updateDimensions(dimensions.width);
  }, [container, dimensions.width]);

  const portals = useMemo(() => {
    if (!dialogs || dialogs.length === 0) {
      return [];
    }

    const portals: ReactNode[] = [];

    for (const [id, dialogRenderable] of container.getDialogRenderables()) {
      const dialogWithJsx = dialogRenderable.dialog as DialogWithJsx;
      const jsxContent = dialogWithJsx[JSX_CONTENT_KEY];

      if (jsxContent !== undefined) {
        portals.push(createPortal(jsxContent, dialogRenderable, id));
      }
    }

    return portals;
  }, [container, dialogs]);

  // Set dialog visibility
  // requestAnimationFrame is polyfilled by @opentui/core
  useLayoutEffect(() => {
    // dialogs triggers re-run when dialog state changes
    void dialogs;

    const raf = (globalThis as Record<string, unknown>)
      .requestAnimationFrame as (callback: () => void) => number;

    for (const [, dialogRenderable] of container.getDialogRenderables()) {
      raf(() => {
        dialogRenderable.visible = true;
      });
    }
  }, [container, dialogs]);

  return (
    <DialogContext.Provider value={manager}>
      {children}
      {portals}
    </DialogContext.Provider>
  );
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
