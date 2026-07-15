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
} from "@tuiparts/core/dialog";
import {
  createContext,
  createElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";

const tags = {
  root: "otui-dialog-root",
  trigger: "otui-dialog-trigger",
  portal: "otui-dialog-portal",
  backdrop: "otui-dialog-backdrop",
  popup: "otui-dialog-popup",
  title: "otui-dialog-title",
  description: "otui-dialog-description",
  close: "otui-dialog-close",
};
extend({
  [tags.root]: DialogRootRenderable,
  [tags.trigger]: DialogTriggerRenderable,
  [tags.portal]: DialogPortalRenderable,
  [tags.backdrop]: DialogBackdropRenderable,
  [tags.popup]: DialogPopupRenderable,
  [tags.title]: DialogTitleRenderable,
  [tags.description]: DialogDescriptionRenderable,
  [tags.close]: DialogCloseRenderable,
});

const StoreContext = createContext<DialogStore | null>(null);
type PartProps<Options, Renderable> = Omit<Options, "store"> & {
  ref?: Ref<Renderable>;
  children?: ReactNode;
};
type RootProps = Omit<DialogRootOptions, "store"> & {
  children?: ReactNode | ((state: DialogState) => ReactNode);
  ref?: Ref<DialogRootRenderable>;
};
type TriggerProps = PartProps<DialogTriggerOptions, DialogTriggerRenderable>;
type PortalProps = Omit<DialogPortalOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<DialogPortalRenderable>;
  visible?: never;
  zIndex?: never;
};
type BackdropProps = PartProps<
  ConstructorParameters<typeof DialogBackdropRenderable>[1],
  DialogBackdropRenderable
>;
type PopupProps = Omit<DialogPopupOptions, "store"> & {
  children?: ReactNode;
  ref?: Ref<DialogPopupRenderable>;
};
type TitleProps = PartProps<DialogTitleOptions, DialogTitleRenderable>;
type DescriptionProps = PartProps<
  DialogDescriptionOptions,
  DialogDescriptionRenderable
>;
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
  const destroyStore = useCallback(() => store.destroy(), [store]);
  const handleRootRef = useCallback(
    (root: DialogRootRenderable | null) => {
      if (root) {
        root.off("destroyed", destroyStore);
        root.once("destroyed", destroyStore);
      }
      if (typeof ref === "function") ref(root);
      else if (ref) ref.current = root;
    },
    [destroyStore, ref],
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    StoreContext.Provider,
    { value: store },
    createElement(tags.root, { ...props, store, ref: handleRootRef }, content),
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
export function Portal({
  children,
  ref,
  visible: _visible,
  zIndex: _zIndex,
  ...props
}: Portal.Props) {
  const renderer = useRenderer();
  return createPortal(
    createElement(
      tags.portal,
      { ...props, store: useStore("Portal"), ref },
      children,
    ),
    renderer.root,
    renderer.root,
  );
}
export function Backdrop({ children, ref, ...props }: Backdrop.Props) {
  return createElement(
    tags.backdrop,
    { ...props, store: useStore("Backdrop"), ref },
    children,
  );
}
export function Popup({ children, ref, ...props }: Popup.Props) {
  return createElement(
    tags.popup,
    { ...props, store: useStore("Popup"), ref },
    children,
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
  return createElement(
    tags.close,
    { ...props, store: useStore("Close"), ref },
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
