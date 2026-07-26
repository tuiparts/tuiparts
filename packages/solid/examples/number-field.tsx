/** @jsxImportSource @opentui/solid */

import { createCliRenderer } from "@opentui/core";
import { render } from "@opentui/solid";
import type { NumberFieldInputRenderable } from "@tuiparts/core/number-field";
import { createSignal, onMount } from "solid-js";
import { NumberField } from "../src/number-field";

function Demo() {
  const [value, setValue] = createSignal<number | null>(2);
  const [status, setStatus] = createSignal("Value: 2");
  let input: NumberFieldInputRenderable | undefined;
  onMount(() => queueMicrotask(() => input?.focus()));
  return (
    <box flexDirection="column" gap={1} padding={2}>
      <text content="Solid NumberField Primitive" fg="#FFFFFF" />
      <text
        content="Edit or use Up/Down. Drag the label. Press −/+. Ctrl+C quits."
        fg="#737373"
      />
      <NumberField.Root
        value={value()}
        onValueChange={setValue}
        onValueCommit={(next, details) =>
          setStatus(`Committed: ${next ?? "empty"} (${details.reason})`)
        }
        min={0}
        max={20}
        step={0.5}
        flexDirection="column"
        gap={1}
      >
        {(state: NumberField.Root.State) => (
          <>
            <NumberField.ScrubArea
              height={1}
              paddingX={1}
              width={24}
            >
              <text
                content="Quantity ↔ drag"
                fg={state.scrubbing ? "#60A5FA" : "#D4D4D4"}
              />
            </NumberField.ScrubArea>
            <box flexDirection="row">
              <NumberField.Decrement width={3} justifyContent="center">
                <text content="−" />
              </NumberField.Decrement>
              <NumberField.Input
                ref={(renderable) => (input = renderable)}
                backgroundColor="#171717"
                focusedBackgroundColor="#262626"
                textColor="#FFFFFF"
                width={10}
              />
              <NumberField.Increment width={3} justifyContent="center">
                <text content="+" />
              </NumberField.Increment>
            </box>
            <text
              content={`Value: ${state.value ?? "empty"}; draft: ${state.inputValue || "empty"}`}
              fg="#60A5FA"
            />
          </>
        )}
      </NumberField.Root>
      <text content={status()} fg="#737373" />
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");
await render(() => <Demo />, renderer);
