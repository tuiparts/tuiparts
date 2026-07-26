import type { ToggleGroupStore } from "@tuiparts/core/toggle-group";
import { createContext } from "react";

/** Private ToggleGroup ownership consumed by Toggle. */
export const ToggleGroupContext = createContext<ToggleGroupStore | null>(null);
