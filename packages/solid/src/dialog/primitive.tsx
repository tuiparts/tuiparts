/** @jsxImportSource @opentui/solid */

import {
  extend,
  Portal as SolidPortal,
  spread,
  useRenderer,
} from "@opentui/solid";
import type { DialogPrimitiveState } from "@opentui-ui/core/dialog";
import {
  type DialogBackdropOptions,
  DialogBackdropRenderable,
  type DialogCloseOptions,
  DialogCloseRenderable,
  type DialogDescriptionOptions,
  DialogDescriptionRenderable,
  type DialogPopupOptions,
  DialogPopupRenderable,
  type DialogPortalOptions,
  DialogPortalRenderable,
  type DialogRootOptions,
  DialogRootRenderable,
  DialogStore,
  type DialogTitleOptions,
  DialogTitleRenderable,
  type DialogTriggerOptions,
  DialogTriggerRenderable,
} from "@opentui-ui/core/dialog";
import {
  createComponent,
  createContext,
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  type Ref,
  splitProps,
  untrack,
  useContext,
} from "solid-js";

const tags = {
  root: "otui-dialog-primitive-root",
  trigger: "otui-dialog-primitive-trigger",
  backdrop: "otui-dialog-primitive-backdrop",
  popup: "otui-dialog-primitive-popup",
  title: "otui-dialog-primitive-title",
  description: "otui-dialog-primitive-description",
  close: "otui-dialog-primitive-close",
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
export type DialogRootProps = Omit<DialogRootOptions, "store"> & {
  children?: JSX.Element | ((state: DialogPrimitiveState) => JSX.Element);
  ref?: Ref<DialogRootRenderable>;
};
export type DialogTriggerProps = Omit<DialogTriggerOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogTriggerRenderable>;
};
export type DialogPortalProps = Omit<DialogPortalOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogPortalRenderable>;
};
export type DialogBackdropProps = Omit<DialogBackdropOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogBackdropRenderable>;
};
export type DialogPopupProps = Omit<DialogPopupOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogPopupRenderable>;
};
export type DialogTitleProps = Omit<DialogTitleOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogTitleRenderable>;
};
export type DialogDescriptionProps = Omit<DialogDescriptionOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogDescriptionRenderable>;
};
export type DialogCloseProps = Omit<DialogCloseOptions, "store"> & {
  children?: JSX.Element;
  ref?: Ref<DialogCloseRenderable>;
};

function setRef<T>(ref: Ref<T> | undefined, value: T): void {
  if (typeof ref === "function") (ref as (value: T) => void)(value);
}
function spreadProps<T extends object>(
  element: Parameters<typeof spread>[0],
  getProps: () => T,
): void {
  let previous: string[] = [];
  spread(element, () => {
    const next = getProps() as Record<string, unknown>;
    const removed = Object.fromEntries(
      previous
        .filter((key) => !Object.hasOwn(next, key))
        .map((key) => [key, undefined]),
    );
    previous = Object.keys(next);
    return { ...removed, ...next };
  });
}
function useStore(name: string): DialogStore {
  const store = useContext(StoreContext);
  if (!store)
    throw new Error(
      `DialogPrimitive.${name} must be rendered inside DialogPrimitive.Root`,
    );
  return store;
}

function Root(props: DialogRootProps): JSX.Element {
  const renderer = useRenderer();
  const store = new DialogStore(
    renderer,
    untrack(() => props),
  );
  const [state, setState] = createSignal(store.state);
  const publicState: DialogPrimitiveState = {
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
  onCleanup(store.subscribe(setState));
  setRef(local.ref, element);
  return createComponent(StoreContext.Provider, {
    value: store,
    get children() {
      const child = local.children;
      const content = typeof child === "function" ? child(publicState) : child;
      spreadProps(element, () => ({ ...initial, children: content }));
      return element;
    },
  });
}
function Trigger(props: DialogTriggerProps): JSX.Element {
  const store = useStore("Trigger");
  const [local, initial] = splitProps(props, ["ref"]);
  const renderer = useRenderer();
  const element = new DialogTriggerRenderable(
    renderer,
    untrack(() => ({ ...initial, store })),
  );
  setRef(local.ref, element);
  spreadProps(element, () => ({ ...initial }));
  return element;
}
function Portal(props: DialogPortalProps): JSX.Element {
  const renderer = useRenderer();
  const store = useStore("Portal");
  const [local, initial] = splitProps(props, ["children", "ref"]);
  const portal = new DialogPortalRenderable(
    renderer,
    untrack(() => ({ ...initial, store })),
  );
  renderer.root.add(portal);
  setRef(local.ref, portal);
  spreadProps(portal, () => ({ ...initial }));
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
function Backdrop(props: DialogBackdropProps): JSX.Element {
  const store = useStore("Backdrop");
  const renderer = useRenderer();
  const [local, initial] = splitProps(props, ["ref"]);
  const element = new DialogBackdropRenderable(
    renderer,
    untrack(() => ({ ...initial, store })),
  );
  setRef(local.ref, element);
  spreadProps(element, () => ({ ...initial }));
  return element;
}
function Popup(props: DialogPopupProps): JSX.Element {
  const store = useStore("Popup");
  const renderer = useRenderer();
  const [local, initial] = splitProps(props, ["children", "ref"]);
  const element = new DialogPopupRenderable(
    renderer,
    untrack(() => ({ ...initial, store })),
  );
  setRef(local.ref, element);
  spreadProps(element, () => ({ ...initial, children: local.children }));
  return element;
}
function TextPart(
  props: (DialogTitleProps | DialogDescriptionProps) & {
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
  setRef(local.ref, element);
  spreadProps(element, () => ({ ...initial }));
  return element;
}
function Title(props: DialogTitleProps): JSX.Element {
  return TextPart({ ...props, tag: tags.title, store: useStore("Title") });
}
function Description(props: DialogDescriptionProps): JSX.Element {
  return TextPart({
    ...props,
    tag: tags.description,
    store: useStore("Description"),
  });
}
function Close(props: DialogCloseProps): JSX.Element {
  const store = useStore("Close");
  const renderer = useRenderer();
  const [local, initial] = splitProps(props, ["ref"]);
  const element = new DialogCloseRenderable(
    renderer,
    untrack(() => ({ ...initial, store })),
  );
  setRef(local.ref, element);
  let unregister: (() => void) | undefined;
  onMount(() => {
    let parent = element.parent;
    while (parent && !(parent instanceof DialogPopupRenderable)) {
      parent = parent.parent;
    }
    if (parent) unregister = parent.registerFocusable(element);
  });
  onCleanup(() => unregister?.());
  spreadProps(element, () => ({ ...initial }));
  return element;
}
export const DialogPrimitive = {
  Root,
  Trigger,
  Portal,
  Backdrop,
  Popup,
  Title,
  Description,
  Close,
} as const;
