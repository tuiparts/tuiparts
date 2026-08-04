/** @jsxImportSource @opentui/solid */

import { createCliRenderer } from "@opentui/core";
import { render } from "@opentui/solid";
import type { SliderTrackRenderable } from "@tuiparts/core/slider";
import { createSignal, onMount } from "solid-js";
import { Slider } from "../src/slider";

function SliderParts(props: { state: Slider.Root.State }) {
  const offset = () => {
    const { max, min, value } = props.state;
    return Math.round(((value - min) / (max - min)) * 31);
  };
  return (
    <>
      <Slider.Track
        height={1}
        position="relative"
        ref={(renderable) => (track = renderable)}
        width={32}
      >
        <text
          content={"─".repeat(32)}
          fg="#525252"
          position="absolute"
        />
        <Slider.Range
          height={1}
          position="absolute"
          width={offset() + 1}
        >
          <text content={"━".repeat(offset() + 1)} fg="#60A5FA" />
        </Slider.Range>
        <Slider.Thumb
          height={1}
          left={offset()}
          position="absolute"
          width={1}
        >
          <text
            content="●"
            fg={props.state.focused ? "#FFFFFF" : "#A3A3A3"}
          />
        </Slider.Thumb>
      </Slider.Track>
      <text content={`Value: ${props.state.value}`} fg="#60A5FA" />
    </>
  );
}

let track: SliderTrackRenderable | undefined;

function Demo() {
  const [value, setValue] = createSignal(25);
  const [status, setStatus] = createSignal("Value: 25");
  onMount(() => queueMicrotask(() => track?.focus()));
  return (
    <box flexDirection="column" gap={1} padding={2}>
      <text content="Solid Slider Primitive" fg="#FFFFFF" />
      <text
        content="Click or drag Track. Left/Right step. Home/End and Page keys jump. Ctrl+C quits."
        fg="#737373"
      />
      <Slider.Root
        largeStep={20}
        max={100}
        min={0}
        onValueChange={setValue}
        onValueCommit={(next, details) =>
          setStatus(`Committed: ${next} (${details.reason})`)
        }
        step={5}
        value={value()}
      >
        {(state: Slider.Root.State) => <SliderParts state={state} />}
      </Slider.Root>
      <text content={status()} fg="#737373" />
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");
await render(() => <Demo />, renderer);
