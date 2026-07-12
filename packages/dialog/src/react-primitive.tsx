/** @jsxImportSource @opentui/react */

import { createPortal, extend, useRenderer } from "@opentui/react";
import {
  createContext,
  createElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { DialogPrimitiveState } from "./primitive/index";
import {
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
} from "./primitive/index";

const tags = {
  root: "otui-dialog-primitive-root",
  trigger: "otui-dialog-primitive-trigger",
  backdrop: "otui-dialog-primitive-backdrop",
  popup: "otui-dialog-primitive-popup",
  title: "otui-dialog-primitive-title",
  description: "otui-dialog-primitive-description",
  close: "otui-dialog-primitive-close",
};
extend({
  [tags.root]: DialogRootRenderable,
  [tags.trigger]: DialogTriggerRenderable,
  [tags.backdrop]: DialogBackdropRenderable,
  [tags.popup]: DialogPopupRenderable,
  [tags.title]: DialogTitleRenderable,
  [tags.description]: DialogDescriptionRenderable,
  [tags.close]: DialogCloseRenderable,
});

const StoreContext = createContext<DialogStore | null>(null);
const PopupContext = createContext<DialogPopupRenderable | null>(null);
// biome-ignore lint/suspicious/noExplicitAny: intrinsic refs share React's ref union
type PartProps<T> = Omit<T, "store"> & { ref?: Ref<any>; children?: ReactNode };
export type DialogRootProps = Omit<DialogRootOptions, "store"> & {
  children?: ReactNode | ((state: DialogPrimitiveState) => ReactNode);
  ref?: Ref<DialogRootRenderable>;
};
export type DialogTriggerProps = PartProps<DialogTriggerOptions>;
export type DialogPortalProps = Omit<DialogPortalOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<DialogPortalRenderable>;
};
export type DialogBackdropProps = PartProps<
  ConstructorParameters<typeof DialogBackdropRenderable>[1]
>;
export type DialogPopupProps = Omit<DialogPopupOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<DialogPopupRenderable>;
};
export type DialogTitleProps = PartProps<DialogTitleOptions>;
export type DialogDescriptionProps = PartProps<DialogDescriptionOptions>;
export type DialogCloseProps = Omit<DialogCloseOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<DialogCloseRenderable>;
};

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

function Root({ children, ref, ...props }: DialogRootProps) {
  const renderer = useRenderer();
  const storeRef = useRef<DialogStore | null>(null);
  if (!storeRef.current) storeRef.current = new DialogStore(renderer, props);
  const store = storeRef.current;
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state,
  );
  useEffect(() => () => store.destroy(), [store]);
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    StoreContext.Provider,
    { value: store },
    createElement(tags.root, { ...props, store, ref }, content),
  );
}
function useStore(name: string): DialogStore {
  const store = useContext(StoreContext);
  if (!store)
    throw new Error(
      `DialogPrimitive.${name} must be rendered inside DialogPrimitive.Root`,
    );
  return store;
}
function Trigger({ children, ref, ...props }: DialogTriggerProps) {
  return createElement(
    tags.trigger,
    { ...props, store: useStore("Trigger"), ref },
    children,
  );
}
function Portal({ children, ref, ...props }: DialogPortalProps) {
  const renderer = useRenderer();
  const store = useStore("Portal");
  const [portal] = useState(
    () => new DialogPortalRenderable(renderer, { ...props, store }),
  );
  useEffect(() => {
    renderer.root.add(portal);
    return () => {
      if (!portal.isDestroyed && portal.parent) portal.parent.remove(portal);
      if (!portal.isDestroyed) portal.destroyRecursively();
    };
  }, [portal, renderer]);
  useEffect(() => {
    setRef(ref, portal);
    return () => setRef(ref, null);
  }, [portal, ref]);
  useLayoutEffect(() => {
    const {
      visible: _,
      zIndex: __,
      ...safeProps
    } = props as DialogPortalOptions & {
      visible?: unknown;
      zIndex?: unknown;
    };
    Object.assign(portal, safeProps);
  });
  return createPortal(children, portal, portal);
}
function Backdrop({ children, ref, ...props }: DialogBackdropProps) {
  return createElement(
    tags.backdrop,
    { ...props, store: useStore("Backdrop"), ref },
    children,
  );
}
function Popup({ children, ref, ...props }: DialogPopupProps) {
  const store = useStore("Popup");
  const [popup, setPopup] = useState<DialogPopupRenderable | null>(null);
  const popupRef = useCallback(
    (value: DialogPopupRenderable | null) => {
      setPopup((current) => (current === value ? current : value));
      setRef(ref, value);
    },
    [ref],
  );
  return createElement(
    PopupContext.Provider,
    { value: popup },
    createElement(tags.popup, { ...props, store, ref: popupRef }, children),
  );
}
function TextPart({
  tag,
  children,
  store,
  ...props
}: {
  tag: string;
  children?: ReactNode;
  store: DialogStore;
  [key: string]: unknown;
}) {
  return createElement(tag, { ...props, store }, children);
}
function Title({ children, ...props }: DialogTitleProps) {
  return (
    <TextPart tag={tags.title} store={useStore("Title")} {...props}>
      {children}
    </TextPart>
  );
}
function Description({ children, ...props }: DialogDescriptionProps) {
  return (
    <TextPart tag={tags.description} store={useStore("Description")} {...props}>
      {children}
    </TextPart>
  );
}
function Close({ children, ref, ...props }: DialogCloseProps) {
  const store = useStore("Close");
  const popup = useContext(PopupContext);
  const closeRef = useRef<DialogCloseRenderable | null>(null);
  const closeElementRef = useCallback(
    (value: DialogCloseRenderable | null) => {
      closeRef.current = value;
      setRef(ref, value);
    },
    [ref],
  );
  useEffect(() => {
    const close = closeRef.current;
    if (!popup || !close) return;
    return popup.registerFocusable(close);
  }, [popup]);
  return createElement(
    tags.close,
    { ...props, store, ref: closeElementRef },
    children,
  );
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
