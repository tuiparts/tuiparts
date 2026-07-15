/** @jsxImportSource @opentui/solid */

import { extend, Portal as SolidPortal, useRenderer } from "@opentui/solid";
import {
  type DialogBackdropOptions,
  DialogBackdropRenderable,
  type DialogCloseOptions,
  DialogCloseRenderable,
  type DialogDescriptionOptions,
  DialogDescriptionRenderable,
  type DialogOpenChangeDetails,
  type DialogOpenChangeReason,
  type DialogPopupOptions,
  DialogPopupRenderable,
  type DialogPortalOptions,
  DialogPortalRenderable,
  type DialogRootOptions,
  DialogRootRenderable,
  type DialogState,
  DialogStore,
  type DialogTitleOptions,
  DialogTitleRenderable,
  type DialogTriggerOptions,
  DialogTriggerRenderable,
} from "@tuiparts/core/dialog";
import {
  createComponent,
  createContext,
  createEffect,
  type JSX,
  onCleanup,
  onMount,
  type Ref,
  splitProps,
  untrack,
  useContext,
} from "solid-js";
import {
  setRenderableRef,
  spreadRenderableProps,
} from "../internal/renderable-props";
import { createRenderableState } from "../internal/renderable-state";

const tags = {
  root: "otui-dialog-root",
  trigger: "otui-dialog-trigger",
  backdrop: "otui-dialog-backdrop",
  popup: "otui-dialog-popup",
  title: "otui-dialog-title",
  description: "otui-dialog-description",
  close: "otui-dialog-close",
} as const;
extend({
  [tags.root]: DialogRootRenderable,
  [tags.trigger]: DialogTriggerRenderable,
  [tags.backdrop]: DialogBackdropRenderable,
  [tags.popup]: DialogPopupRenderable,
  [tags.title]: DialogTitleRenderable,
  [tags.description]: DialogDescriptionRenderable,
  [tags.close]: DialogCloseRenderable,
});
const StoreContext = createContext<DialogStore>();
type RootProps = Omit<DialogRootOptions, "store"> & {
  children?: JSX.Element | ((state: DialogState) => JSX.Element);
  ref?: Ref<DialogRootRenderable>;
};
type TriggerProps = Omit<DialogTriggerOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogTriggerRenderable>;
};
type PortalProps = Omit<DialogPortalOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogPortalRenderable>;
};
type BackdropProps = Omit<DialogBackdropOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogBackdropRenderable>;
};
type PopupProps = Omit<DialogPopupOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogPopupRenderable>;
};
type TitleProps = Omit<DialogTitleOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogTitleRenderable>;
};
type DescriptionProps = Omit<DialogDescriptionOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogDescriptionRenderable>;
};
type CloseProps = Omit<DialogCloseOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogCloseRenderable>;
};

function useStore(name: string): DialogStore {
  const store = useContext(StoreContext);
  if (!store)
    throw new Error(`Dialog.${name} must be rendered inside Dialog.Root`);
  return store;
}

export function Root(props: Root.Props): JSX.Element {
  const renderer = useRenderer();
  const store = new DialogStore(
    renderer,
    untrack(() => props),
  );
  const state = createRenderableState(store, store.state);
  const publicState: DialogState = {
    get open() {
      return state().open;
    },
  };
  const [local, initial] = splitProps(props, [
    "children",
    "open",
    "onOpenChange",
    "ref",
  ]);
  const element = new DialogRootRenderable(
    renderer,
    untrack(() => ({ ...initial, store })),
  );
  createEffect(() => {
    element.open = local.open;
    element.onOpenChange = local.onOpenChange;
  });
  onCleanup(() => {
    store.destroy();
    if (!element.isDestroyed) element.destroy();
  });
  setRenderableRef(local.ref, element);
  return createComponent(StoreContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const content = typeof child === "function" ? child(publicState) : child;
      spreadRenderableProps(element, () => ({ ...initial, children: content }));
      return element;
    },
  });
}
export function Trigger(props: Trigger.Props): JSX.Element {
  const store = useStore("Trigger");
  const [local, initial] = splitProps(props, ["ref"]);
  const renderer = useRenderer();
  const element = new DialogTriggerRenderable(
    renderer,
    untrack(() => ({ ...initial, store })),
  );
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({ ...initial }));
  return element;
}
export function Portal(props: Portal.Props): JSX.Element {
  const renderer = useRenderer();
  const store = useStore("Portal");
  const [local, initial] = splitProps(props, ["children", "ref"]);
  const portal = new DialogPortalRenderable(
    renderer,
    untrack(() => ({ ...initial, store })),
  );
  renderer.root.add(portal);
  setRenderableRef(local.ref, portal);
  spreadRenderableProps(portal, () => ({ ...initial }));
  onCleanup(() => {
    if (!portal.isDestroyed) {
      renderer.root.remove(portal);
      portal.destroyRecursively();
    }
  });
  return createComponent(SolidPortal, {
    mount: portal,
    get children() {
      return local.children;
    },
  });
}
export function Backdrop(props: Backdrop.Props): JSX.Element {
  const store = useStore("Backdrop");
  const renderer = useRenderer();
  const [local, initial] = splitProps(props, ["ref"]);
  const element = new DialogBackdropRenderable(
    renderer,
    untrack(() => ({ ...initial, store })),
  );
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({ ...initial }));
  return element;
}
export function Popup(props: Popup.Props): JSX.Element {
  const store = useStore("Popup");
  const renderer = useRenderer();
  const [local, initial] = splitProps(props, [
    "children",
    "initialFocus",
    "ref",
  ]);
  const element = new DialogPopupRenderable(
    renderer,
    untrack(() => ({ ...initial, initialFocus: local.initialFocus, store })),
  );
  createEffect(() => {
    element.initialFocus = local.initialFocus;
  });
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({
    ...initial,
    children: local.children,
  }));
  return element;
}
function TextPart(
  props: (TitleProps | DescriptionProps) & {
    tag: string;
    store: DialogStore;
  },
): JSX.Element {
  const { tag, store, ...rest } = props;
  const renderer = useRenderer();
  const [local, initial] = splitProps(rest, ["ref"]);
  const element =
    tag === tags.title
      ? new DialogTitleRenderable(
          renderer,
          untrack(() => ({ ...initial, store })),
        )
      : new DialogDescriptionRenderable(
          renderer,
          untrack(() => ({ ...initial, store })),
        );
  setRenderableRef(local.ref, element);
  spreadRenderableProps(element, () => ({ ...initial }));
  return element;
}
export function Title(props: Title.Props): JSX.Element {
  return TextPart({ ...props, tag: tags.title, store: useStore("Title") });
}
export function Description(props: Description.Props): JSX.Element {
  return TextPart({
    ...props,
    tag: tags.description,
    store: useStore("Description"),
  });
}
export function Close(props: Close.Props): JSX.Element {
  const store = useStore("Close");
  const renderer = useRenderer();
  const [local, initial] = splitProps(props, ["ref"]);
  const element = new DialogCloseRenderable(
    renderer,
    untrack(() => ({ ...initial, store })),
  );
  setRenderableRef(local.ref, element);
  let unregister: (() => void) | undefined;
  onMount(() => {
    let parent = element.parent;
    while (parent && !(parent instanceof DialogPopupRenderable)) {
      parent = parent.parent;
    }
    if (parent) unregister = parent.registerFocusable(element);
  });
  onCleanup(() => unregister?.());
  spreadRenderableProps(element, () => ({ ...initial }));
  return element;
}
export namespace Root {
  export type Props = RootProps;
  export type State = DialogState;
  export type OpenChangeDetails = DialogOpenChangeDetails;
  export type OpenChangeReason = DialogOpenChangeReason;
}

export namespace Trigger {
  export type Props = TriggerProps;
}
export namespace Portal {
  export type Props = PortalProps;
}
export namespace Backdrop {
  export type Props = BackdropProps;
}
export namespace Popup {
  export type Props = PopupProps;
}
export namespace Title {
  export type Props = TitleProps;
}
export namespace Description {
  export type Props = DescriptionProps;
}
export namespace Close {
  export type Props = CloseProps;
}
