import { afterEach, describe, expect, it } from "bun:test";
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
} from "@opentui-ui/core/dialog";
import { act, createElement, createRef, type ReactNode, useState } from "react";
import { DialogPrimitive } from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React DialogPrimitive", () => {
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
        createElement(DialogPrimitive.Trigger, {
          id: "react-trigger",
          ref: triggerRef,
        }),
        createElement(
          DialogPrimitive.Portal,
          { id: "react-portal", ref: portalRef },
          createElement(DialogPrimitive.Backdrop, {
            id: "react-backdrop",
            ref: backdropRef,
            position: "absolute",
            width: 40,
            height: 10,
          }),
          createElement(
            DialogPrimitive.Popup,
            { id: "react-popup", ref: popupRef },
            createElement(DialogPrimitive.Title, {
              id: "react-title",
              ref: titleRef,
              content: "Title",
            }),
            createElement(DialogPrimitive.Description, {
              id: "react-description",
              ref: descriptionRef,
              content: "Description",
            }),
            createElement(DialogPrimitive.Close, {
              id: "react-close",
              ref: closeRef,
            }),
          ),
        ),
      );
    setup = await testRender(
      createElement(
        DialogPrimitive.Root,
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
    expect(closeRef.current?.focused).toBe(true);
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

  it("applies one controlled request without remounting the layer", async () => {
    const changes: string[] = [];
    const rootRef = createRef<DialogRootRenderable>();
    const triggerRef = createRef<DialogTriggerRenderable>();
    const portalRef = createRef<DialogPortalRenderable>();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return createElement(
        DialogPrimitive.Root,
        {
          open,
          ref: rootRef,
          onOpenChange: (next, details) => {
            changes.push(`${next}:${details.reason}`);
            setOpen(next);
          },
        },
        createElement(DialogPrimitive.Trigger, { ref: triggerRef }),
        createElement(
          DialogPrimitive.Portal,
          { ref: portalRef },
          createElement(DialogPrimitive.Backdrop),
          createElement(DialogPrimitive.Popup),
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
    let updateId: ((id: string) => void) | undefined;
    let portalRef: DialogPortalRenderable | null = null;
    function App() {
      const [id, setId] = useState("react-portal-before");
      updateId = setId;
      return createElement(
        DialogPrimitive.Root,
        null,
        createElement(
          DialogPrimitive.Portal,
          {
            id,
            ref: (portal) => {
              portalRef = portal;
            },
          },
          createElement(DialogPrimitive.Backdrop),
          createElement(DialogPrimitive.Popup),
        ),
      );
    }
    setup = await testRender(createElement(App), { width: 40, height: 10 });
    const currentPortal = () => portalRef as DialogPortalRenderable | null;
    const portal = currentPortal();

    await act(async () => updateId?.("react-portal-after"));
    await setup.waitFor(() => currentPortal()?.id === "react-portal-after");

    expect(currentPortal()).toBe(portal);
    expect(currentPortal()?.isDestroyed).toBe(false);
    expect(currentPortal()?.parent).toBe(setup.renderer.root);
  });
});
