/** @jsxImportSource @opentui/solid */

import { Progress as ProgressPrimitive } from "@tuiparts/solid/progress";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface ProgressProps extends ProgressPrimitive.Root.Props {
  indicatorOptions?: ProgressPrimitive.Indicator.Props;
}

/** Consumer-owned Solid Progress recipe installed on packaged Progress behavior. */
export function Progress(props: ProgressProps) {
  const [recipe, root] = splitProps(props, ["indicatorOptions"]);
  const tokens = useTheme();

  return (
    <ProgressPrimitive.Root
      backgroundColor={root.backgroundColor ?? tokens().colors.surface}
      height={root.height ?? 1}
      {...root}
    >
      <ProgressPrimitive.Indicator
        backgroundColor={
          recipe.indicatorOptions?.backgroundColor ?? tokens().colors.primary
        }
        height={recipe.indicatorOptions?.height ?? 1}
        {...recipe.indicatorOptions}
      />
    </ProgressPrimitive.Root>
  );
}
