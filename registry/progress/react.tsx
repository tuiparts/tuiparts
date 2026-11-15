/** @jsxImportSource @opentui/react */

import { Progress as ProgressPrimitive } from "@tuiparts/react/progress";
import { useTheme } from "./use-theme";

export interface ProgressProps extends ProgressPrimitive.Root.Props {
  indicatorOptions?: ProgressPrimitive.Indicator.Props;
}

/** Consumer-owned React Progress recipe installed on packaged Progress behavior. */
export function Progress({ indicatorOptions, ...props }: ProgressProps) {
  const tokens = useTheme();

  return (
    <ProgressPrimitive.Root
      backgroundColor={props.backgroundColor ?? tokens.colors.surface}
      height={props.height ?? 1}
      {...props}
    >
      <ProgressPrimitive.Indicator
        backgroundColor={
          indicatorOptions?.backgroundColor ?? tokens.colors.primary
        }
        height={indicatorOptions?.height ?? 1}
        {...indicatorOptions}
      />
    </ProgressPrimitive.Root>
  );
}
