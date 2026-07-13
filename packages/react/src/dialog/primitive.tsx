/** @jsxImportSource @opentui/react */

import { createPortal, extend, useRenderer } from "@opentui/react";
import {
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
} from "@opentui-ui/core/dialog";
import {
  createContext,
  createElement,
  type ReactNode,
  type Ref,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const tags = {
  root: "otui-dialog-root",
  trigger: "otui-dialog-trigger",
  backdrop: "otui-dialog-backdrop",
  popup: "otui-dialog-popup",
  title: "otui-dialog-title",
  description: "otui-dialog-description",
  close: "otui-dialog-close",
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
type RootProps = Omit<DialogRootOptions, "store"> & {
  children?: ReactNode | ((state: DialogState) => ReactNode);
  ref?: Ref<DialogRootRenderable>;
};
type TriggerProps = PartProps<DialogTriggerOptions>;
type PortalProps = Omit<DialogPortalOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<DialogPortalRenderable>;
};
type BackdropProps = PartProps<
  ConstructorParameters<typeof DialogBackdropRenderable>[1]
>;
type PopupProps = Omit<DialogPopupOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<DialogPopupRenderable>;
};
type TitleProps = PartProps<DialogTitleOptions>;
type DescriptionProps = PartProps<DialogDescriptionOptions>;
type CloseProps = Omit<DialogCloseOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<DialogCloseRenderable>;
};

export function Root({ children, ref, ...props }: Root.Props) {
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
    throw new Error(`Dialog.${name} must be rendered inside Dialog.Root`);
  return store;
}
export function Trigger({ children, ref, ...props }: Trigger.Props) {
  return createElement(
    tags.trigger,
    { ...props, store: useStore("Trigger"), ref },
    children,
  );
}
export function Portal({ children, ref, ...props }: Portal.Props) {
  const renderer = useRenderer();
  const store = useStore("Portal");
  const [portal] = useState(
    () => new DialogPortalRenderable(renderer, { ...props, store }),
  );
  useImperativeHandle(ref, () => portal, [portal]);
  useEffect(() => {
    renderer.root.add(portal);
    return () => {
      if (!portal.isDestroyed && portal.parent) portal.parent.remove(portal);
      if (!portal.isDestroyed) portal.destroyRecursively();
    };
  }, [portal, renderer]);
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
export function Backdrop({ children, ref, ...props }: Backdrop.Props) {
  return createElement(
    tags.backdrop,
    { ...props, store: useStore("Backdrop"), ref },
    children,
  );
}
export function Popup({ children, ref, ...props }: Popup.Props) {
  const store = useStore("Popup");
  const [popup, setPopup] = useState<DialogPopupRenderable | null>(null);
  useImperativeHandle(ref, () => popup as DialogPopupRenderable, [popup]);
  return createElement(
    PopupContext.Provider,
    { value: popup },
    createElement(tags.popup, { ...props, store, ref: setPopup }, children),
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
export function Title({ children, ...props }: Title.Props) {
  return (
    <TextPart tag={tags.title} store={useStore("Title")} {...props}>
      {children}
    </TextPart>
  );
}
export function Description({ children, ...props }: Description.Props) {
  return (
    <TextPart tag={tags.description} store={useStore("Description")} {...props}>
      {children}
    </TextPart>
  );
}
export function Close({ children, ref, ...props }: Close.Props) {
  const store = useStore("Close");
  const popup = useContext(PopupContext);
  const [close, setClose] = useState<DialogCloseRenderable | null>(null);
  useImperativeHandle(ref, () => close as DialogCloseRenderable, [close]);
  useEffect(() => {
    if (!popup || !close) return;
    return popup.registerFocusable(close);
  }, [close, popup]);
  return createElement(
    tags.close,
    { ...props, store, ref: setClose },
    children,
  );
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
