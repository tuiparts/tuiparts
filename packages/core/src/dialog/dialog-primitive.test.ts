import { afterEach, describe, expect, it } from "bun:test";
import { BoxRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  DialogBackdropRenderable,
  DialogCloseRenderable,
  DialogPopupRenderable,
  DialogPortalRenderable,
  DialogRootRenderable,
  DialogStore,
  DialogTitleRenderable,
  DialogTriggerRenderable,
} from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function dialog(renderer: TestRendererSetup["renderer"], store: DialogStore) {
  const portal = new DialogPortalRenderable(renderer, { store });
  const backdrop = new DialogBackdropRenderable(renderer, {
    store,
    position: "absolute",
    width: 40,
    height: 10,
  });
  const popup = new DialogPopupRenderable(renderer, {
    store,
    position: "absolute",
    left: 10,
    top: 2,
    width: 10,
    height: 3,
  });
  portal.add(backdrop);
  portal.add(popup);
  renderer.root.add(portal);
  return { portal, backdrop, popup };
}

describe("Dialog Core primitive", () => {
  it("composes unstyled parts and supports uncontrolled trigger/close cycles", () => {
    return (async () => {
      setup = await createTestRenderer({ width: 40, height: 10 });
      const root = new DialogRootRenderable(setup.renderer);
      const trigger = new DialogTriggerRenderable(setup.renderer, {
        store: root.store,
      });
      const close = new DialogCloseRenderable(setup.renderer, {
        store: root.store,
      });
      const title = new DialogTitleRenderable(setup.renderer, {
        store: root.store,
        content: "caller text",
      });
      const layer = dialog(setup.renderer, root.store);
      layer.popup.add(title);
      root.add(trigger);
      root.add(close);
      setup.renderer.root.add(root);

      expect(layer.popup.getChildren()).toEqual([title]);
      expect(layer.portal.top).toBe(0);
      expect(layer.portal.left).toBe(0);
      trigger.press();
      expect(root.state.open).toBe(true);
      expect(layer.portal.visible).toBe(true);
      expect(layer.backdrop.visible).toBe(true);
      const zOrder = [
        layer.portal.zIndex,
        layer.backdrop.zIndex,
        layer.popup.zIndex,
      ];
      close.press();
      expect(root.state.open).toBe(false);
      expect(layer.portal.visible).toBe(false);
      expect(layer.backdrop.visible).toBe(false);
      expect(layer.popup.visible).toBe(false);
      trigger.press();
      expect(root.state.open).toBe(true);
      expect(layer.portal.visible).toBe(true);
      expect(layer.backdrop.visible).toBe(true);
      expect(layer.popup.visible).toBe(true);
      expect(layer.portal.getChildren()).toEqual([layer.backdrop, layer.popup]);
      expect([
        layer.portal.zIndex,
        layer.backdrop.zIndex,
        layer.popup.zIndex,
      ]).toEqual(zOrder);
      expect(layer.popup.focused).toBe(true);
      layer.backdrop.processMouseEvent({ type: "up" } as never);
      expect(root.state.open).toBe(false);
    })();
  });

  it("reports controlled intent and allows user dismissal cancellation", () => {
    return (async () => {
      setup = await createTestRenderer({ width: 40, height: 10 });
      const changes: string[] = [];
      const root = new DialogRootRenderable(setup.renderer, {
        open: false,
        onOpenChange: (open, details) => {
          changes.push(`${open}:${details.reason}`);
          if (details.reason === "trigger") details.preventDefault();
        },
      });
      const trigger = new DialogTriggerRenderable(setup.renderer, {
        store: root.store,
      });
      root.add(trigger);
      setup.renderer.root.add(root);
      trigger.press();
      expect(root.state.open).toBe(false);
      expect(changes).toEqual(["true:trigger"]);

      root.open = true;
      const layer = dialog(setup.renderer, root.store);
      root.onOpenChange = (_open, details) => details.preventDefault();
      await setup.mockInput.pressEscape();
      expect(root.state.open).toBe(true);
      expect(layer.popup.focused).toBe(true);
    })();
  });

  it("keeps escape with the topmost layer, including canceled top layers", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const lower = new DialogStore(setup.renderer, { defaultOpen: true });
    const upper = new DialogStore(setup.renderer, {
      defaultOpen: true,
      onOpenChange: (_open, details) => details.preventDefault(),
    });
    dialog(setup.renderer, lower);
    dialog(setup.renderer, upper);
    await setup.mockInput.pressEscape();
    expect(upper.state.open).toBe(true);
    expect(lower.state.open).toBe(true);
  });

  it("dismisses only from Backdrop, and gives popup clicks no dismissal behavior", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const store = new DialogStore(setup.renderer, { defaultOpen: true });
    const { backdrop, popup } = dialog(setup.renderer, store);
    await setup.mockMouse.click(11, 3);
    expect(store.state.open).toBe(true);
    await setup.mockMouse.click(1, 1);
    expect(store.state.open).toBe(false);
    expect(backdrop.visible).toBe(false);
    expect(popup.visible).toBe(false);
  });

  it("opens from Trigger into the initial target and restores Trigger on final close", () => {
    return (async () => {
      setup = await createTestRenderer({ width: 40, height: 10 });
      const root = new DialogRootRenderable(setup.renderer);
      const trigger = new DialogTriggerRenderable(setup.renderer, {
        store: root.store,
      });
      const layer = dialog(setup.renderer, root.store);
      const initial = new BoxRenderable(setup.renderer, { focusable: true });
      layer.popup.add(initial);
      layer.popup.registerFocusable(initial, true);
      root.add(trigger);
      setup.renderer.root.add(root);

      trigger.press();
      expect(initial.focused).toBe(true);
      new DialogCloseRenderable(setup.renderer, { store: root.store }).press();
      expect(trigger.focused).toBe(true);
    })();
  });

  it("restores the focused control after programmatic opening", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const opener = new BoxRenderable(setup.renderer, { focusable: true });
    setup.renderer.root.add(opener);
    opener.focus();
    const store = new DialogStore(setup.renderer);
    dialog(setup.renderer, store);

    store.setOpen(true);
    expect(opener.focused).toBe(false);
    store.setOpen(false);

    expect(opener.focused).toBe(true);
  });

  it("arbitrates direct backdrop dismissal to the topmost layer", () => {
    return (async () => {
      setup = await createTestRenderer({ width: 40, height: 10 });
      const lower = new DialogStore(setup.renderer, { defaultOpen: true });
      const upper = new DialogStore(setup.renderer, { defaultOpen: true });
      const lowerLayer = dialog(setup.renderer, lower);
      dialog(setup.renderer, upper);
      lowerLayer.backdrop.processMouseEvent({ type: "up" } as never);
      expect(lower.state.open).toBe(true);
      expect(upper.state.open).toBe(true);
    })();
  });

  it("skips destroyed, hidden, and non-focusable targets while tabbing", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const store = new DialogStore(setup.renderer, { defaultOpen: true });
    const { popup } = dialog(setup.renderer, store);
    const hidden = new BoxRenderable(setup.renderer, {
      focusable: true,
      visible: false,
    });
    const disabled = new BoxRenderable(setup.renderer, { focusable: false });
    const live = new BoxRenderable(setup.renderer, { focusable: true });
    popup.add(hidden);
    popup.add(disabled);
    popup.add(live);
    popup.registerFocusable(hidden, true);
    popup.registerFocusable(disabled);
    popup.registerFocusable(live);
    hidden.destroy();
    popup.focusInitial();
    expect(live.focused).toBe(true);
    live.visible = false;
    await setup.mockInput.pressTab();
    expect(popup.focused).toBe(true);
  });

  it("contains external focus targets and reverses into the final live descendant", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const external = new BoxRenderable(setup.renderer, { focusable: true });
    setup.renderer.root.add(external);
    const store = new DialogStore(setup.renderer);
    const { popup } = dialog(setup.renderer, store);
    const first = new BoxRenderable(setup.renderer, { focusable: true });
    const last = new BoxRenderable(setup.renderer, { focusable: true });
    const hiddenParent = new BoxRenderable(setup.renderer, { visible: false });
    const hiddenInitial = new BoxRenderable(setup.renderer, {
      focusable: true,
    });
    hiddenParent.add(hiddenInitial);
    popup.add(first);
    popup.add(last);
    popup.add(hiddenParent);
    popup.registerFocusable(external);
    popup.registerFocusable(hiddenInitial, true);

    store.setOpen(true);
    expect(first.focused).toBe(true);
    external.focus();
    popup.moveFocus(-1);
    expect(last.focused).toBe(true);

    popup.registerFocusable(first, true);
    popup.remove(first);
    setup.renderer.root.add(first);
    popup.focusInitial();
    expect(last.focused).toBe(true);
  });

  it("does not restore focus to a detached trigger", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const root = new DialogRootRenderable(setup.renderer);
    const trigger = new DialogTriggerRenderable(setup.renderer, {
      store: root.store,
    });
    root.add(trigger);
    setup.renderer.root.add(root);
    dialog(setup.renderer, root.store);

    trigger.press();
    root.remove(trigger);
    root.store.setOpen(false);

    expect(trigger.focused).toBe(false);
    expect(setup.renderer.currentFocusedRenderable).not.toBe(trigger);
  });

  it("contains forward and reverse tab focus, restores nested and final focus, and stacks explicitly", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const trigger = new BoxRenderable(setup.renderer, { focusable: true });
    setup.renderer.root.add(trigger);
    trigger.focus();
    const outer = new DialogStore(setup.renderer, { defaultOpen: true });
    const outerLayer = dialog(setup.renderer, outer);
    const first = new BoxRenderable(setup.renderer, { focusable: true });
    const second = new BoxRenderable(setup.renderer, { focusable: true });
    outerLayer.popup.add(first);
    outerLayer.popup.add(second);
    outerLayer.popup.registerFocusable(first, true);
    outerLayer.popup.registerFocusable(second);
    outerLayer.popup.focusInitial();
    await setup.mockInput.pressTab();
    expect(second.focused).toBe(true);
    setup.mockInput.pressTab({ shift: true });
    expect(first.focused).toBe(true);
    second.focus();

    const inner = new DialogStore(setup.renderer, { defaultOpen: true });
    const innerLayer = dialog(setup.renderer, inner);
    expect(innerLayer.popup.zIndex).toBeGreaterThan(outerLayer.popup.zIndex);
    inner.setOpen(false);
    expect(second.focused).toBe(true);
    outer.setOpen(false);
    expect(trigger.focused).toBe(true);
  });

  it("tears down open nested layers without leaving dismissal handlers active", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const outer = new DialogStore(setup.renderer, { defaultOpen: true });
    const inner = new DialogStore(setup.renderer, { defaultOpen: true });
    const outerLayer = dialog(setup.renderer, outer);
    const innerLayer = dialog(setup.renderer, inner);
    innerLayer.portal.destroyRecursively();
    outerLayer.portal.destroyRecursively();
    await setup.mockInput.pressEscape();
    expect(outer.state.open).toBe(true);
    expect(inner.state.open).toBe(true);
  });

  it("removes its public key listener when the final portal is destroyed", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const store = new DialogStore(setup.renderer, { defaultOpen: true });
    const listenerCount = setup.renderer.keyInput.listenerCount("keypress");
    const { portal } = dialog(setup.renderer, store);
    expect(setup.renderer.keyInput.listenerCount("keypress")).toBe(
      listenerCount + 1,
    );
    portal.destroyRecursively();
    expect(setup.renderer.keyInput.listenerCount("keypress")).toBe(
      listenerCount,
    );
    await setup.mockInput.pressEscape();
    expect(store.state.open).toBe(true);
  });

  it("does not destroy an injected store when Root is destroyed", () => {
    return (async () => {
      setup = await createTestRenderer({ width: 40, height: 10 });
      const store = new DialogStore(setup.renderer);
      const root = new DialogRootRenderable(setup.renderer, { store });
      root.destroy();
      store.setOpen(true);
      expect(store.state.open).toBe(true);
    })();
  });
});
