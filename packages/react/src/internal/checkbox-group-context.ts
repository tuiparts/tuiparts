import type { CheckboxGroupStore } from "@tuiparts/core/checkbox-group";
import { createContext } from "react";

/** Private CheckboxGroup ownership consumed by Checkbox.Root. */
export const CheckboxGroupContext = createContext<CheckboxGroupStore | null>(
  null,
);
