#!/usr/bin/env bun

/** @jsxImportSource @opentui/react */

import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useRenderer } from "@opentui/react";
import { Toaster, toast } from "@tuiparts/toast/react";

function App() {
  const renderer = useRenderer();

  useKeyboard((key) => {
    if (key.name === "1") {
      toast.success("Hello World");
    } else if (key.name === "2") {
      toast.error("Hello World");
    } else if (key.name === "3") {
      toast.warning("Hello World");
    } else if (key.name === "4") {
      toast.info("Hello World");
    } else if (key.name === "5") {
      toast.loading("Hello World");
    } else if (key.name === "6") {
      toast.dismiss();
    } else if (key.name === "q") {
      renderer.destroy();
    }
  });

  return (
    <>
      <Toaster stackingMode="stack" />
      <text>Press 1-5 to show a toast, 6 to dismiss all, q to quit</text>
    </>
  );
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
