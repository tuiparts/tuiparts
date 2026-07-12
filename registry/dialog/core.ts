import { type RenderContext, TextRenderable } from "@opentui/core";
import {
  DialogBackdropRenderable,
  DialogCloseRenderable,
  DialogDescriptionRenderable,
  DialogPopupRenderable,
  DialogPortalRenderable,
  type DialogRootOptions,
  DialogRootRenderable,
  DialogTitleRenderable,
  DialogTriggerRenderable,
} from "@opentui-ui/dialog";

/** Visual defaults only; the Dialog primitive retains all layer behavior. */
export interface DialogOptions extends DialogRootOptions {
  width?: number;
}

export interface DialogRecipe {
  root: DialogRootRenderable;
  trigger: DialogTriggerRenderable;
  portal: DialogPortalRenderable;
  backdrop: DialogBackdropRenderable;
  popup: DialogPopupRenderable;
}

/** Assemble an editable, terminal-wide Dialog layer from packaged Core parts. */
export function createDialog(
  ctx: RenderContext,
  { width = 48, ...options }: DialogOptions = {},
): DialogRecipe {
  const root = new DialogRootRenderable(ctx, options);
  const trigger = new DialogTriggerRenderable(ctx, {
    store: root.store,
    backgroundColor: "#262626",
    border: true,
    borderColor: "#525252",
    paddingLeft: 1,
    paddingRight: 1,
  });
  const portal = new DialogPortalRenderable(ctx, {
    store: root.store,
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  });
  const backdrop = new DialogBackdropRenderable(ctx, {
    store: root.store,
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
  });
  const popup = new DialogPopupRenderable(ctx, {
    store: root.store,
    width,
    flexDirection: "column",
    backgroundColor: "#171717",
    border: true,
    borderColor: "#737373",
    padding: 1,
    gap: 1,
  });
  portal.add(backdrop);
  portal.add(popup);
  root.add(trigger);
  return { root, trigger, portal, backdrop, popup };
}

export function addDialogTitle(
  ctx: RenderContext,
  dialog: DialogRecipe,
  content: string,
): DialogTitleRenderable {
  const title = new DialogTitleRenderable(ctx, {
    store: dialog.root.store,
    content,
    fg: "#FFFFFF",
  });
  dialog.popup.add(title);
  return title;
}

export function addDialogDescription(
  ctx: RenderContext,
  dialog: DialogRecipe,
  content: string,
): DialogDescriptionRenderable {
  const description = new DialogDescriptionRenderable(ctx, {
    store: dialog.root.store,
    content,
    fg: "#A3A3A3",
  });
  dialog.popup.add(description);
  return description;
}

/** Adds an editable close affordance; dismissal behavior remains primitive-owned. */
export function addDialogClose(
  ctx: RenderContext,
  dialog: DialogRecipe,
  label = "× Close",
): DialogCloseRenderable {
  const close = new DialogCloseRenderable(ctx, {
    store: dialog.root.store,
    backgroundColor: "#262626",
    border: true,
    borderColor: "#525252",
    paddingLeft: 1,
    paddingRight: 1,
  });
  close.add(new TextRenderable(ctx, { content: label, fg: "#E5E5E5" }));
  dialog.popup.add(close);
  return close;
}
