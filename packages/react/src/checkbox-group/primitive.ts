import { extend } from "@opentui/react";
import {
  type CheckboxGroupChangeDetails,
  type CheckboxGroupOptions,
  type CheckboxGroupOrientation,
  CheckboxGroupRenderable,
  type CheckboxGroupState,
  CheckboxGroupStore,
  type CheckboxGroupValueChangeHandler,
} from "@tuiparts/core/checkbox-group";
import {
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { useCoreStore } from "../internal/use-core-store";
import { CheckboxGroupContext } from "./context";

const CHECKBOX_GROUP_TAG = "otui-checkbox-group";

extend({ [CHECKBOX_GROUP_TAG]: CheckboxGroupRenderable });

type CheckboxGroupProps = Omit<CheckboxGroupOptions, "store"> & {
  children?: ReactNode | ((state: CheckboxGroupState) => ReactNode);
  ref?: Ref<CheckboxGroupRenderable>;
};

/** React adapter for CheckboxGroup selection and collection ownership. */
export function CheckboxGroup({
  children,
  ...props
}: CheckboxGroup.Props): ReactElement {
  const [store, state] = useCoreStore<CheckboxGroupState, CheckboxGroupStore>(
    () => new CheckboxGroupStore(props),
  );
  const content = typeof children === "function" ? children(state) : children;
  return createElement(
    CheckboxGroupContext.Provider,
    { value: store },
    createElement(CHECKBOX_GROUP_TAG, { ...props, store }, content),
  );
}

CheckboxGroup.displayName = "CheckboxGroup";

/** Types scoped to the React CheckboxGroup component. */
export namespace CheckboxGroup {
  export type Props = CheckboxGroupProps;
  export type State = CheckboxGroupState;
  export type ChangeDetails = CheckboxGroupChangeDetails;
  export type Orientation = CheckboxGroupOrientation;
  export type ValueChangeHandler = CheckboxGroupValueChangeHandler;
}
