import {
  type BoxOptions,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
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
} from "@tuiparts/core/dialog";
import { type Tokens, theme, tint } from "./theme";

/** Visual defaults only; the Dialog primitive retains all layer behavior. */
export interface DialogOptions extends DialogRootOptions {
  width?: BoxOptions["width"];
}

export interface DialogRecipe {
  root: DialogRootRenderable;
  trigger: DialogTriggerRenderable;
  portal: DialogPortalRenderable;
  backdrop: DialogBackdropRenderable;
  popup: DialogPopupRenderable;
}

/** Applies themed styling now and on every change until `renderable` is destroyed. */
function bindThemeStyle(
  renderable: { destroy(): void },
  applyStyle: (tokens: Readonly<Tokens>) => void,
): void {
  applyStyle(theme.get());
  const unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  const destroy = renderable.destroy.bind(renderable);
  renderable.destroy = () => {
    unsubscribeTheme();
    destroy();
  };
}

/** Assemble an editable, terminal-wide Dialog layer from packaged Core parts. */
export function createDialog(
  ctx: RenderContext,
  { width = "80%", ...options }: DialogOptions = {},
): DialogRecipe {
  const tokens = theme.get();
  const root = new DialogRootRenderable(ctx, options);
  const trigger = new DialogTriggerRenderable(ctx, {
    store: root.store,
    paddingLeft: tokens.density.paddingX,
    paddingRight: tokens.density.paddingX,
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
  });
  const popup = new DialogPopupRenderable(ctx, {
    store: root.store,
    width,
    maxWidth: 56,
    flexDirection: "column",
    border: true,
    paddingLeft: tokens.density.paddingX,
    paddingRight: tokens.density.paddingX,
  });
  portal.add(backdrop);
  portal.add(popup);
  root.add(trigger);
  bindThemeStyle(root, (tokens) => {
    trigger.backgroundColor = tokens.colors.surface;
    backdrop.backgroundColor = tint(
      tokens.colors.background,
      tokens.colors.foreground,
      0.25,
    );
    popup.backgroundColor = tokens.colors.surface;
    popup.borderColor = tokens.colors.border;
    popup.borderStyle = tokens.borders.style;
  });
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
  });
  bindThemeStyle(title, (tokens) => {
    title.fg = tokens.colors.foreground;
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
  });
  bindThemeStyle(description, (tokens) => {
    description.fg = tokens.colors.mutedForeground;
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
  const tokens = theme.get();
  const close = new DialogCloseRenderable(ctx, {
    store: dialog.root.store,
    paddingLeft: tokens.density.paddingX,
    paddingRight: tokens.density.paddingX,
  });
  const text = new TextRenderable(ctx, { content: label });
  close.add(text);
  bindThemeStyle(close, (tokens) => {
    close.backgroundColor = tokens.colors.surface;
    text.fg = tokens.colors.foreground;
  });
  dialog.popup.add(close);
  return close;
}
