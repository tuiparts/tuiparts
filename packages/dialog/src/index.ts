// Core

// Async Dialog Options (for imperative/core usage)
export type {
  AlertOptions,
  ChoiceOptions,
  ConfirmOptions,
  PromptOptions,
} from "./manager";
export { DialogManager } from "./manager";
export type {
  DialogBackdropOptions,
  DialogCloseOptions,
  DialogDescriptionOptions,
  DialogOpenChangeDetails,
  DialogOpenChangeReason,
  DialogPopupOptions,
  DialogPortalOptions,
  DialogPrimitiveState,
  DialogRootOptions,
  DialogStoreOptions,
  DialogTitleOptions,
  DialogTriggerOptions,
} from "./primitive";
export {
  DialogBackdropRenderable,
  DialogCloseRenderable,
  DialogDescriptionRenderable,
  DialogPopupRenderable,
  DialogPortalRenderable,
  DialogRootRenderable,
  DialogStore,
  DialogTitleRenderable,
  DialogTriggerRenderable,
} from "./primitive";
// Context Types (for content functions)
export type {
  AlertContext,
  ChoiceContext,
  ConfirmContext,
  DialogState,
  PromptContext,
} from "./prompts";
export { DialogContainerRenderable } from "./renderables";
// Themes
export { type DialogTheme, themes } from "./themes";
// Configuration Types
// Base Types (for building custom adapters)
export type {
  AsyncDialogOptions,
  BaseAlertOptions,
  BaseChoiceOptions,
  BaseConfirmOptions,
  BaseDialogActions,
  BasePromptOptions,
  Dialog,
  DialogContainerOptions,
  DialogContentFactory,
  DialogId,
  DialogShowOptions,
  DialogSize,
  DialogStyle,
  DialogToClose,
} from "./types";
export { isDialogToClose } from "./types";
