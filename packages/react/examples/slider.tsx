/** @jsxImportSource @opentui/react */

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import type { SliderTrackRenderable } from "@tuiparts/core/slider";
import { useCallback, useState } from "react";
import { Slider } from "../src/slider";

function Demo() {
  const [value, setValue] = useState(25);
  const [status, setStatus] = useState("Value: 25");
  const focusTrack = useCallback(
    (track: SliderTrackRenderable | null) => track?.focus(),
    [],
  );
  return (
    <box flexDirection="column" gap={1} padding={2}>
      <text content="React Slider Primitive" fg="#FFFFFF" />
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
        value={value}
      >
        {(state) => {
          const ratio = (state.value - state.min) / (state.max - state.min);
          const offset = Math.round(ratio * 31);
          return (
            <>
              <Slider.Track
                height={1}
                position="relative"
                ref={focusTrack}
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
                  width={offset + 1}
                >
                  <text content={"━".repeat(offset + 1)} fg="#60A5FA" />
                </Slider.Range>
                <Slider.Thumb
                  height={1}
                  left={offset}
                  position="absolute"
                  width={1}
                >
                  <text
                    content="●"
                    fg={state.focused ? "#FFFFFF" : "#A3A3A3"}
                  />
                </Slider.Thumb>
              </Slider.Track>
              <text content={`Value: ${state.value}`} fg="#60A5FA" />
            </>
          );
        }}
      </Slider.Root>
      <text content={status} fg="#737373" />
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");
createRoot(renderer).render(<Demo />);
