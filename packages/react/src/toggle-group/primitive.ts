import { extend } from "@opentui/react";
import {
  type ToggleGroupChangeDetails,
  type ToggleGroupOptions,
  type ToggleGroupOrientation,
  ToggleGroupRenderable,
  type ToggleGroupState,
  ToggleGroupStore,
  type ToggleGroupValueChangeHandler,
} from "@tuiparts/core/toggle-group";
import {
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { useCoreStore } from "../internal/use-core-store";
import { ToggleGroupContext } from "../toggle/primitive";

const TOGGLE_GROUP_TAG = "otui-toggle-group";

extend({ [TOGGLE_GROUP_TAG]: ToggleGroupRenderable });

type ToggleGroupProps = Omit<ToggleGroupOptions, "store"> & {
  children?: ReactNode | ((state: ToggleGroupState) => ReactNode);
  ref?: Ref<ToggleGroupRenderable>;
};

/** React adapter for ToggleGroup selection and collection ownership. */
export function ToggleGroup({
  children,
  ...props
}: ToggleGroup.Props): ReactElement {
  const [store, state] = useCoreStore<ToggleGroupState, ToggleGroupStore>(
    () => new ToggleGroupStore(props),
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    ToggleGroupContext.Provider,
    { value: store },
    createElement(TOGGLE_GROUP_TAG, { ...props, store }, content),
  );
}

ToggleGroup.displayName = "ToggleGroup";

/** Types scoped to the React ToggleGroup component. */
export namespace ToggleGroup {
  export type Props = ToggleGroupProps;
  export type State = ToggleGroupState;
  export type ChangeDetails = ToggleGroupChangeDetails;
  export type Orientation = ToggleGroupOrientation;
  export type ValueChangeHandler = ToggleGroupValueChangeHandler;
}
