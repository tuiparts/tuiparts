import { afterEach, expect, test } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createToggleGroup,
  createToggleGroupItem,
} from "./components/ui/toggle-group";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Core ToggleGroup recipe runtime smoke", async () => {
  setup = await createTestRenderer({ width: 30, height: 3 });
  const group = createToggleGroup(setup.renderer);
  const left = createToggleGroupItem(setup.renderer, group.store, {
    label: "Left",
    value: "left",
  });
  group.add(left);
  setup.renderer.root.add(group);
  await setup.renderOnce();
  left.press();
  expect(group.value).toEqual(["left"]);
});
