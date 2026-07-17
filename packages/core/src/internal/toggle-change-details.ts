/** Details describing how a Toggle requested a pressed-state change. */
export type ToggleChangeDetails =
  | Readonly<{ source: "imperative" }>
  | Readonly<{ key: "enter" | "space"; source: "keyboard" }>
  | Readonly<{ button: 0; source: "pointer" }>;
