import { afterEach, describe, expect, it } from "bun:test";
import type { Renderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type {
  DialogBackdropRenderable,
  DialogCloseRenderable,
  DialogDescriptionRenderable,
  DialogPopupRenderable,
  DialogPortalRenderable,
  DialogRootRenderable,
  DialogTitleRenderable,
  DialogTriggerRenderable,
} from "@tuiparts/core/dialog";
import {
  act,
  createElement,
  createRef,
  type ReactNode,
  type Ref,
  StrictMode,
  useState,
} from "react";
import * as Dialog from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React Dialog", () => {
  it("types every public part ref as its Core Renderable", () => {
    type RefTarget<T> = T extends Ref<infer Target> ? Target : never;
    type IsAny<T> = 0 extends 1 & T ? true : false;
    type IsExact<Actual, Expected> =
      IsAny<Actual> extends true
        ? false
        : [Actual, Expected] extends [Expected, Actual]
          ? true
          : false;

    const refsAreTyped: [
      IsExact<
        RefTarget<NonNullable<Dialog.Trigger.Props["ref"]>>,
        DialogTriggerRenderable
      >,
      IsExact<
        RefTarget<NonNullable<Dialog.Backdrop.Props["ref"]>>,
        DialogBackdropRenderable
      >,
      IsExact<
        RefTarget<NonNullable<Dialog.Title.Props["ref"]>>,
        DialogTitleRenderable
      >,
      IsExact<
        RefTarget<NonNullable<Dialog.Description.Props["ref"]>>,
        DialogDescriptionRenderable
      >,
    ] = [true, true, true, true];

    expect(refsAreTyped).toEqual([true, true, true, true]);
  });

  it("does not retain Dialog layers from discarded Strict Mode renders", async () => {
    const changes: string[] = [];
    const rootRef = createRef<DialogRootRenderable>();
    const portalRef = createRef<DialogPortalRenderable>();
    setup = await testRender(
      createElement(
        StrictMode,
        null,
        createElement(
          Dialog.Root,
          {
            defaultOpen: true,
            ref: rootRef,
            onOpenChange: (open, details) =>
              changes.push(`${open}:${details.reason}`),
          },
          createElement(
            Dialog.Portal,
            { ref: portalRef },
            createElement(Dialog.Backdrop),
            createElement(Dialog.Popup),
          ),
        ),
      ),
      { width: 40, height: 10 },
    );

    await setup.waitFor(
      () =>
        rootRef.current?.state.open === true &&
        portalRef.current?.parent === setup?.renderer.root &&
        portalRef.current?.visible === true,
    );
    expect(setup.renderer.keyInput.listenerCount("keypress")).toBe(2);
    expect(portalRef.current?.visible).toBe(true);

    await act(async () => setup?.mockInput.pressEscape());
    await new Promise((resolve) => setTimeout(resolve, 30));
    await act(async () => setup?.mockInput.pressEscape());
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(changes).toEqual(["false:escape"]);
  });

  it("destroys its Store with the committed Root Renderable", async () => {
    const changes: boolean[] = [];
    const rootRef = createRef<DialogRootRenderable>();
    setup = await testRender(
      createElement(Dialog.Root, {
        ref: rootRef,
        onOpenChange: (open) => changes.push(open),
      }),
      { width: 40, height: 10 },
    );
    const store = rootRef.current?.store;

    await act(async () => setup?.renderer.destroy());
    setup = undefined;
    store?.requestOpen(true);

    expect(changes).toEqual([]);
  });

  it("retains every part through open, close, focus containment, and reopen", async () => {
    const changes: string[] = [];
    const rootRef = createRef<DialogRootRenderable>();
    const triggerRef = createRef<DialogTriggerRenderable>();
    const portalRef = createRef<DialogPortalRenderable>();
    const backdropRef = createRef<DialogBackdropRenderable>();
    const popupRef = createRef<DialogPopupRenderable>();
    const titleRef = createRef<DialogTitleRenderable>();
    const descriptionRef = createRef<DialogDescriptionRenderable>();
    const closeRef = createRef<DialogCloseRenderable>();
    const renderState = (state: { open: boolean }) =>
      createElement(
        "box",
        null,
        createElement("text", {
          id: "react-open-state",
          content: state.open ? "open" : "closed",
        }),
        createElement(Dialog.Trigger, {
          id: "react-trigger",
          ref: triggerRef,
        }),
        createElement(
          Dialog.Portal,
          { id: "react-portal", ref: portalRef },
          createElement(Dialog.Backdrop, {
            id: "react-backdrop",
            ref: backdropRef,
            position: "absolute",
            width: 40,
            height: 10,
          }),
          createElement(
            Dialog.Popup,
            { id: "react-popup", ref: popupRef },
            createElement(Dialog.Title, {
              id: "react-title",
              ref: titleRef,
              content: "Title",
            }),
            createElement(Dialog.Description, {
              id: "react-description",
              ref: descriptionRef,
              content: "Description",
            }),
            createElement("box", {
              id: "react-action",
              focusable: true,
            }),
            createElement(Dialog.Close, {
              id: "react-close",
              ref: closeRef,
            }),
          ),
        ),
      );
    setup = await testRender(
      createElement(
        Dialog.Root,
        {
          id: "react-root",
          ref: rootRef,
          onOpenChange: (open, details) =>
            changes.push(`${open}:${details.reason}`),
        },
        renderState as unknown as ReactNode,
      ),
      { width: 40, height: 10 },
    );
    const retained = {
      root: rootRef.current,
      trigger: triggerRef.current,
      portal: portalRef.current,
      backdrop: backdropRef.current,
      popup: popupRef.current,
      title: titleRef.current,
      description: descriptionRef.current,
      close: closeRef.current,
    };
    expect(setup.renderer.keyInput.listenerCount("keypress")).toBe(2);
    expect(portalRef.current?.isDestroyed).toBe(false);
    expect(portalRef.current?.parent).toBe(setup.renderer.root);

    await act(async () => triggerRef.current?.press());
    await setup.waitFor(() => rootRef.current?.state.open === true);
    expect(setup.renderer.currentFocusedRenderable?.id).toBe("react-action");
    await act(async () => setup?.mockInput.pressTab());
    expect(closeRef.current?.focused).toBe(true);
    await act(async () => setup?.mockInput.pressEscape());
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(changes).toContain("false:escape");
    expect(rootRef.current?.state.open).toBe(false);
    expect(triggerRef.current?.focused).toBe(true);
    expect(portalRef.current?.visible).toBe(false);

    await act(async () => triggerRef.current?.press());
    await setup.waitFor(() => portalRef.current?.visible === true);
    expect(rootRef.current).toBe(retained.root);
    expect(triggerRef.current).toBe(retained.trigger);
    expect(portalRef.current).toBe(retained.portal);
    expect(backdropRef.current).toBe(retained.backdrop);
    expect(popupRef.current).toBe(retained.popup);
    expect(titleRef.current).toBe(retained.title);
    expect(descriptionRef.current).toBe(retained.description);
    expect(closeRef.current).toBe(retained.close);
    expect(
      setup.renderer.root.findDescendantById("react-open-state"),
    ).toMatchObject({ plainText: "open" });

    await act(async () => closeRef.current?.press());
    await setup.waitFor(() => rootRef.current?.state.open === false);
    expect(popupRef.current?.visible).toBe(false);
  });

  it("updates initial focus after a descendant ref becomes available", async () => {
    const triggerRef = createRef<DialogTriggerRenderable>();
    const popupRef = createRef<DialogPopupRenderable>();
    const actionRef = createRef<Renderable>();

    function InitialFocusDialog() {
      const [initialFocus, setInitialFocus] = useState<Renderable>();
      return createElement(
        Dialog.Root,
        null,
        createElement(Dialog.Trigger, { ref: triggerRef }),
        createElement(
          Dialog.Portal,
          null,
          createElement(
            Dialog.Popup,
            { ref: popupRef, initialFocus },
            createElement("box", {
              id: "react-initial-action",
              focusable: true,
              ref: (value: Renderable | null) => {
                actionRef.current = value;
                if (value) setInitialFocus(value);
              },
            }),
            createElement(Dialog.Close),
          ),
        ),
      );
    }

    setup = await testRender(createElement(InitialFocusDialog), {
      width: 40,
      height: 10,
    });
    await setup.waitFor(
      () => popupRef.current?.initialFocus === actionRef.current,
    );
    await act(async () => triggerRef.current?.press());

    expect(setup.renderer.currentFocusedRenderable).toBe(actionRef.current);
  });

  it("applies one controlled request without remounting the layer", async () => {
    const changes: string[] = [];
    const rootRef = createRef<DialogRootRenderable>();
    const triggerRef = createRef<DialogTriggerRenderable>();
    const portalRef = createRef<DialogPortalRenderable>();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return createElement(
        Dialog.Root,
        {
          open,
          ref: rootRef,
          onOpenChange: (next, details) => {
            changes.push(`${next}:${details.reason}`);
            setOpen(next);
          },
        },
        createElement(Dialog.Trigger, { ref: triggerRef }),
        createElement(
          Dialog.Portal,
          { ref: portalRef },
          createElement(Dialog.Backdrop),
          createElement(Dialog.Popup),
        ),
      );
    }
    setup = await testRender(createElement(Controlled), {
      width: 40,
      height: 10,
    });
    const root = rootRef.current;
    const portal = portalRef.current;

    await act(async () => triggerRef.current?.press());
    await setup.waitFor(() => rootRef.current?.state.open === true);

    expect(changes).toEqual(["true:trigger"]);
    expect(rootRef.current).toBe(root);
    expect(portalRef.current).toBe(portal);
    expect(portalRef.current?.visible).toBe(true);
  });

  it("retains the Portal across callback ref and layout prop updates", async () => {
    let updateId: ((id: string | undefined) => void) | undefined;
    let rootRef: DialogRootRenderable | null = null;
    let portalRef: DialogPortalRenderable | null = null;
    function App() {
      const [id, setId] = useState<string | undefined>("react-portal-before");
      updateId = setId;
      return createElement(
        Dialog.Root,
        {
          ref: (root) => {
            rootRef = root;
          },
        },
        createElement(
          Dialog.Portal,
          {
            id,
            ref: (portal) => {
              portalRef = portal;
            },
          },
          createElement(Dialog.Backdrop),
          createElement(Dialog.Popup),
        ),
      );
    }
    setup = await testRender(createElement(App), { width: 40, height: 10 });
    const currentRoot = () => rootRef as DialogRootRenderable | null;
    const currentPortal = () => portalRef as DialogPortalRenderable | null;
    const portal = currentPortal();

    await act(async () => updateId?.("react-portal-after"));
    await setup.waitFor(() => currentPortal()?.id === "react-portal-after");
    await act(async () => updateId?.(undefined));
    await setup.waitFor(() => currentPortal()?.id === undefined);

    expect(currentPortal()).toBe(portal);
    expect(currentPortal()?.isDestroyed).toBe(false);
    expect(currentPortal()?.parent).toBe(setup.renderer.root);
    expect(currentRoot()?.listenerCount("destroyed")).toBe(1);
  });
});
