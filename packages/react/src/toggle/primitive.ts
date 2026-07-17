import { extend } from "@opentui/react";
import {
  type ToggleChangeDetails,
  type ToggleOptions,
  type TogglePressedChangeHandler,
  ToggleRenderable,
  type ToggleState,
  ToggleStore,
} from "@tuiparts/core/toggle";
import type { ToggleGroupStore } from "@tuiparts/core/toggle-group";
import {
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useContext,
} from "react";
import { useCoreStore } from "../internal/use-core-store";

const TOGGLE_TAG = "otui-toggle";

extend({ [TOGGLE_TAG]: ToggleRenderable });

/** Private group ownership consumed by Toggle. */
export const ToggleGroupContext = createContext<ToggleGroupStore | null>(null);

type ToggleProps = Omit<ToggleOptions, "group" | "store"> & {
  children?: ReactNode | ((state: ToggleState) => ReactNode);
  ref?: Ref<ToggleRenderable>;
};

/** React adapter for a standalone or grouped Toggle. */
export function Toggle({ children, ...props }: Toggle.Props): ReactElement {
  const group = useContext(ToggleGroupContext);
  const [store, state] = useCoreStore<ToggleState, ToggleStore>(
    () => new ToggleStore({ ...props, group: group ?? undefined }),
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(TOGGLE_TAG, { ...props, store }, content);
}

Toggle.displayName = "Toggle";

/** Types scoped to the React Toggle component. */
export namespace Toggle {
  export type Props = ToggleProps;
  export type State = ToggleState;
  export type ChangeDetails = ToggleChangeDetails;
  export type PressedChangeHandler = TogglePressedChangeHandler;
}
