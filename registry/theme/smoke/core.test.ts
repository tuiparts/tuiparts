import { describe, expect, it } from "bun:test";
import { EventEmitter } from "node:events";
import { RGBA, type ThemeMode } from "@opentui/core";
import {
  createThemeStore,
  type ThemeDefinition,
  terminal,
  theme,
  tint,
} from "./components/ui/theme";
import { ascii } from "./themes/ascii";
import { cobaltDeep } from "./themes/cobalt-deep";

const midnight: ThemeDefinition = {
  tokens: { colors: { primary: "#FFB000" }, glyphs: { check: "x" } },
};

class FakeRenderer extends EventEmitter {
  themeMode: ThemeMode | null = null;
}

describe("installed Core theme recipe", () => {
  it("resolves a frozen, referentially stable snapshot", () => {
    const store = createThemeStore({ base: terminal });
    const first = store.get();

    expect(store.get()).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.colors)).toBe(true);
    expect(first.glyphs.check).toBe("✓");
  });

  it("merges the active definition over the base and notifies", () => {
    const store = createThemeStore({
      base: terminal,
      themes: { terminal: {}, midnight },
      active: "terminal",
    });
    let notified = 0;
    store.subscribe(() => notified++);
    const before = store.get();

    expect(store.setActive("midnight")).toBe(true);
    expect(notified).toBe(1);
    const after = store.get();
    expect(after).not.toBe(before);
    expect(after.colors.primary).toBe("#FFB000");
    expect(after.glyphs.check).toBe("x");
    expect(after.colors.destructive).toBe(terminal.colors.destructive);
    expect(after.density).toEqual(terminal.density);

    expect(store.setActive("unknown")).toBe(false);
    expect(notified).toBe(1);
  });

  it("keeps overrides across setActive", () => {
    const store = createThemeStore({
      base: terminal,
      themes: { terminal: {}, midnight },
      active: "terminal",
    });

    store.override({ colors: { focus: "#00FF00" } });
    store.setActive("midnight");

    expect(store.get().colors.focus).toBe("#00FF00");
    expect(store.get().colors.primary).toBe("#FFB000");
  });

  it("registers themes at runtime", () => {
    const store = createThemeStore({
      base: terminal,
      themes: { terminal: {} },
      active: "terminal",
    });

    expect(store.setActive("runtime")).toBe(false);
    store.register("runtime", { tokens: { colors: { primary: "#123456" } } });
    expect(store.setActive("runtime")).toBe(true);
    expect(store.get().colors.primary).toBe("#123456");
  });

  it("stops notifying after unsubscribe", () => {
    const store = createThemeStore({
      base: terminal,
      themes: { terminal: {}, midnight },
      active: "terminal",
    });
    let notified = 0;
    const unsubscribe = store.subscribe(() => notified++);

    unsubscribe();
    store.setActive("midnight");

    expect(notified).toBe(0);
  });

  it("follows renderer mode changes only while mode is system", () => {
    const adaptive: ThemeDefinition = {
      tokens: { colors: { background: "#101010" } },
      light: { colors: { background: "#FAFAFA" } },
    };
    const store = createThemeStore({
      base: terminal,
      themes: { adaptive },
      active: "adaptive",
      mode: "system",
    });
    const renderer = new FakeRenderer();
    renderer.themeMode = "light";

    const unfollow = store.follow(renderer);
    expect(store.get().colors.background).toBe("#FAFAFA");

    renderer.emit("theme_mode", "dark");
    expect(store.get().colors.background).toBe("#101010");

    store.setMode("light");
    renderer.emit("theme_mode", "dark");
    expect(store.get().colors.background).toBe("#FAFAFA");

    store.setMode("system");
    expect(store.get().colors.background).toBe("#101010");

    unfollow();
    renderer.emit("theme_mode", "light");
    expect(store.get().colors.background).toBe("#101010");
  });

  it("applies installed presets as partial overrides with base fallback", () => {
    const store = createThemeStore({
      base: terminal,
      themes: { terminal: {}, "cobalt-deep": cobaltDeep, ascii },
      active: "terminal",
      mode: "dark",
    });

    store.setActive("cobalt-deep");
    expect(store.get().colors.primary).toBe("#FFB000");
    expect(store.get().colors.background).toBe("#0D1117");
    expect(store.get().glyphs.check).toBe(terminal.glyphs.check);

    store.setMode("light");
    expect(store.get().colors.background).toBe("#F6F8FA");
    expect(store.get().colors.primary).toBe("#B58500");

    store.setActive("ascii");
    expect(store.get().glyphs.check).toBe("x");
    expect(store.get().glyphs.track).toBe("-");
    expect(store.get().colors.primary).toBe(terminal.colors.primary);
  });

  it("blends colors toward an overlay with tint", () => {
    const blended = tint(
      RGBA.fromInts(0, 0, 0),
      RGBA.fromInts(255, 255, 255),
      0.5,
    );

    expect(blended.toInts().slice(0, 3)).toEqual([128, 128, 128]);
    expect(tint("#000000", "#FFFFFF", 0).toInts().slice(0, 3)).toEqual([
      0, 0, 0,
    ]);
  });

  it("exposes the app-wide singleton resolved to the terminal default", () => {
    expect(theme.get().glyphs.check).toBe("✓");
    expect(theme.setActive("terminal")).toBe(true);
  });
});
