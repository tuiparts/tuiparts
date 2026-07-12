/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import { type BaseRenderable, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type {
  RadioGroupItemRenderable,
  RadioGroupRootRenderable,
} from "@opentui-ui/core/radio";
import { createSignal } from "solid-js";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";

let setup: TestRendererSetup | undefined;

function item(id: string): RadioGroupItemRenderable {
  return setup?.renderer.root.findDescendantById(
    id,
  ) as RadioGroupItemRenderable;
}

function text(node: BaseRenderable): string[] {
  return [
    ...(node instanceof TextRenderable ? [node.plainText] : []),
    ...node.getChildren().flatMap(text),
  ];
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Solid RadioGroup recipe runtime smoke", async () => {
  let setDynamicVisible: (visible: boolean) => void = () => {};
  let uncontrolledRootRef: RadioGroupRootRenderable | undefined;
  let retainedAlphaRef: RadioGroupItemRenderable | undefined;
  let controlledRootRef: RadioGroupRootRenderable | undefined;
  let controlledBetaRef: RadioGroupItemRenderable | undefined;

  setup = await testRender(
    () => {
      const [dynamicVisible, updateDynamicVisible] = createSignal(true);
      const [controlledValue, setControlledValue] =
        createSignal("controlled-a");
      setDynamicVisible = updateDynamicVisible;

      return (
        <box flexDirection="column">
          <RadioGroup
            id="uncontrolled-root"
            defaultValue="alpha"
            ref={(value) => {
              uncontrolledRootRef = value;
            }}
          >
            <RadioGroupItem
              id="alpha"
              value="alpha"
              label="Alpha"
              mark="x"
              ref={(value) => {
                retainedAlphaRef = value;
              }}
            />
            <RadioGroupItem
              id="disabled"
              value="disabled"
              label="Disabled"
              disabled
            />
            {dynamicVisible() ? (
              <RadioGroupItem id="dynamic" value="dynamic" label="Dynamic" />
            ) : null}
            <RadioGroupItem id="omega" value="omega" label="Omega" />
          </RadioGroup>
          <RadioGroup
            id="controlled-root"
            value={controlledValue()}
            onValueChange={setControlledValue}
            ref={(value) => {
              controlledRootRef = value;
            }}
          >
            <RadioGroupItem
              id="controlled-a"
              value="controlled-a"
              label="Controlled A"
            />
            <RadioGroupItem
              id="controlled-b"
              value="controlled-b"
              label="Controlled B"
              ref={(value) => {
                controlledBetaRef = value;
              }}
            />
          </RadioGroup>
        </box>
      );
    },
    { width: 40, height: 12 },
  );
  await setup.renderOnce();

  const uncontrolledRoot = uncontrolledRootRef;
  const alpha = retainedAlphaRef;
  const controlledRoot = controlledRootRef;
  const controlledBeta = controlledBetaRef;
  expect(uncontrolledRoot).toBeDefined();
  expect(alpha).toBeDefined();
  expect(controlledRoot).toBeDefined();
  expect(controlledBeta).toBeDefined();
  if (!uncontrolledRoot || !alpha || !controlledRoot || !controlledBeta) {
    throw new Error("RadioGroup recipe refs were not assigned");
  }

  expect(uncontrolledRoot.value).toBe("alpha");
  expect(text(alpha)).toEqual(["x", "Alpha"]);
  expect(text(uncontrolledRoot)).toEqual([
    "x",
    "Alpha",
    "Disabled",
    "Dynamic",
    "Omega",
  ]);
  expect(uncontrolledRoot.getChildren()).toHaveLength(4);
  expect(alpha.getChildren()).toHaveLength(2);

  item("omega").press();
  await setup.waitFor(() => uncontrolledRoot.value === "omega");
  expect(text(alpha)).toEqual(["Alpha"]);

  alpha.focus();
  await setup.mockInput.pressArrow("down");
  await setup.waitFor(() => item("dynamic").focused);
  expect(item("disabled").focused).toBe(false);
  expect(uncontrolledRoot.value).toBe("dynamic");

  await setup.mockInput.pressArrow("down");
  await setup.waitFor(() => item("omega").focused);
  await setup.mockInput.pressArrow("down");
  await setup.waitFor(() => alpha.focused);
  expect(uncontrolledRoot.value).toBe("alpha");

  await setup.mockInput.pressKey("END");
  await setup.waitFor(() => item("omega").focused);
  await setup.mockInput.pressKey("HOME");
  await setup.waitFor(() => alpha.focused);

  item("dynamic").focus();
  item("dynamic").press();
  await setup.waitFor(() => uncontrolledRoot.value === "dynamic");
  setDynamicVisible(false);
  await setup.waitFor(
    () =>
      setup?.renderer.root.findDescendantById("dynamic") === undefined &&
      item("omega").focused,
  );
  expect(uncontrolledRoot.value).toBeNull();
  expect(setup.renderer.root.findDescendantById("uncontrolled-root")).toBe(
    uncontrolledRoot,
  );
  expect(item("alpha")).toBe(alpha);

  controlledBeta.press();
  await setup.waitFor(() => controlledRoot.value === "controlled-b");
  expect(setup.renderer.root.findDescendantById("controlled-root")).toBe(
    controlledRoot,
  );
  expect(item("controlled-b")).toBe(controlledBeta);
});
