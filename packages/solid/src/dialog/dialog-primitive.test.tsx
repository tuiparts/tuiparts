/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
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
import { createSignal } from "solid-js";
import { DialogPrimitive } from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid DialogPrimitive", () => {
  it("retains every part through open, close, focus containment, and reopen", async () => {
    const changes: string[] = [];
    let root: DialogRootRenderable | undefined;
    let trigger: DialogTriggerRenderable | undefined;
    let portal: DialogPortalRenderable | undefined;
    let backdrop: DialogBackdropRenderable | undefined;
    let popup: DialogPopupRenderable | undefined;
    let title: DialogTitleRenderable | undefined;
    let description: DialogDescriptionRenderable | undefined;
    let close: DialogCloseRenderable | undefined;
    setup = await testRender(
      () => (
        <DialogPrimitive.Root
          id="solid-root"
          ref={(value) => {
            root = value;
          }}
          onOpenChange={(open, details) =>
            changes.push(`${open}:${details.reason}`)
          }
        >
          {(state: { open: boolean }) => (
            <box>
              <text
                id="solid-open-state"
                content={state.open ? "open" : "closed"}
              />
              <DialogPrimitive.Trigger
                id="solid-trigger"
                ref={(value) => {
                  trigger = value;
                }}
              />
              <DialogPrimitive.Portal
                id="solid-portal"
                ref={(value) => {
                  portal = value;
                }}
              >
                <DialogPrimitive.Backdrop
                  id="solid-backdrop"
                  position="absolute"
                  width={40}
                  height={10}
                  ref={(value) => {
                    backdrop = value;
                  }}
                />
                <DialogPrimitive.Popup
                  id="solid-popup"
                  ref={(value) => {
                    popup = value;
                  }}
                >
                  <DialogPrimitive.Title
                    id="solid-title"
                    content="Title"
                    ref={(value) => {
                      title = value;
                    }}
                  />
                  <DialogPrimitive.Description
                    id="solid-description"
                    content="Description"
                    ref={(value) => {
                      description = value;
                    }}
                  />
                  <DialogPrimitive.Close
                    id="solid-close"
                    ref={(value) => {
                      close = value;
                    }}
                  />
                </DialogPrimitive.Popup>
              </DialogPrimitive.Portal>
            </box>
          )}
        </DialogPrimitive.Root>
      ),
      { width: 40, height: 10 },
    );
    const retained = {
      root,
      trigger,
      portal,
      backdrop,
      popup,
      title,
      description,
      close,
    };
    expect(setup.renderer.keyInput.listenerCount("keypress")).toBe(2);
    expect(portal?.isDestroyed).toBe(false);
    expect(portal?.parent).toBe(setup.renderer.root);

    trigger?.press();
    await setup.waitFor(() => root?.state.open === true);
    expect(close).toBeDefined();
    if (!close) throw new Error("Solid Dialog Close ref was not assigned");
    expect(popup).toBeDefined();
    if (!popup) throw new Error("Solid Dialog Popup ref was not assigned");
    const retainedClose = close;
    const retainedPopup = popup;
    expect(close.parent).toBe(retainedPopup);
    expect(close?.focusable).toBe(true);
    expect(setup.renderer.currentFocusedRenderable).toBe(close);
    expect(close?.focused).toBe(true);
    await setup.mockInput.pressTab();
    expect(close?.focused).toBe(true);
    await setup.mockInput.pressEscape();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(changes).toContain("false:escape");
    expect(root?.state.open).toBe(false);
    expect(trigger?.focused).toBe(true);
    expect(portal?.visible).toBe(false);

    trigger?.press();
    await setup.waitFor(() => portal?.visible === true);
    expect(root).toBe(retained.root);
    expect(trigger).toBe(retained.trigger);
    expect(portal).toBe(retained.portal);
    expect(backdrop).toBe(retained.backdrop);
    expect(popup).toBe(retainedPopup);
    expect(title).toBe(retained.title);
    expect(description).toBe(retained.description);
    expect(close).toBe(retainedClose);
    expect(
      setup.renderer.root.findDescendantById("solid-open-state"),
    ).toMatchObject({ plainText: "open" });

    close?.press();
    await setup.waitFor(() => root?.state.open === false);
    expect(popup?.visible).toBe(false);
  });

  it("applies one controlled request without remounting the layer", async () => {
    const changes: string[] = [];
    let root: DialogRootRenderable | undefined;
    let trigger: DialogTriggerRenderable | undefined;
    let portal: DialogPortalRenderable | undefined;
    setup = await testRender(
      () => {
        const [open, setOpen] = createSignal(false);
        return (
          <DialogPrimitive.Root
            open={open()}
            ref={(value) => {
              root = value;
            }}
            onOpenChange={(next, details) => {
              changes.push(`${next}:${details.reason}`);
              setOpen(next);
            }}
          >
            <DialogPrimitive.Trigger
              ref={(value) => {
                trigger = value;
              }}
            />
            <DialogPrimitive.Portal
              ref={(value) => {
                portal = value;
              }}
            >
              <DialogPrimitive.Backdrop />
              <DialogPrimitive.Popup />
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        );
      },
      { width: 40, height: 10 },
    );
    const retainedRoot = root;
    const retainedPortal = portal;

    trigger?.press();
    await setup.waitFor(() => root?.state.open === true);

    expect(changes).toEqual(["true:trigger"]);
    expect(root).toBe(retainedRoot);
    expect(portal).toBe(retainedPortal);
    expect(portal?.visible).toBe(true);
  });
});
