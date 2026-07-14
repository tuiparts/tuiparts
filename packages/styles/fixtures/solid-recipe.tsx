/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { Checkbox as CheckboxPrimitive } from "@opentui-ui/solid/checkbox";
import {
  createRecipe,
  defineRecipeContract,
  type RecipeProps,
  type StyleProps,
} from "@opentui-ui/styles";
import { splitProps } from "solid-js";

type CheckboxBaseProps = Omit<CheckboxPrimitive.Root.Props, "children"> & {
  label: string;
};

const checkboxContract = defineRecipeContract<CheckboxBaseProps>()({
  slots: {} as {
    root: StyleProps<BoxOptions>;
    indicator: StyleProps<TextOptions>;
    label: StyleProps<TextOptions>;
  },
  stateKeys: ["checked", "disabled", "focused"] as const,
});

const checkboxRecipe = createRecipe(checkboxContract, {
  base: {
    root: { flexDirection: "row", gap: 1 },
    indicator: { fg: "#3B82F6", _checked: { fg: "#10B981" } },
    label: { fg: "#E5E5E5", _disabled: { fg: "#737373" } },
  },
  variants: {
    density: {
      compact: { root: { gap: 0 } },
      comfortable: { root: { gap: 1 } },
    },
    tone: {
      accent: { indicator: { fg: "#3B82F6" } },
      success: { indicator: { fg: "#10B981" } },
    },
  },
  defaultVariants: { density: "comfortable", tone: "accent" },
});

export type ThemedCheckboxProps = CheckboxBaseProps &
  RecipeProps<typeof checkboxRecipe>;

export function ThemedCheckbox(props: ThemedCheckboxProps) {
  const [recipeProps, local, root] = splitProps(
    props,
    ["density", "tone", "styles"],
    ["label"],
  );

  return (
    <CheckboxPrimitive.Root {...root}>
      {(state: CheckboxPrimitive.Root.State) => {
        const styles = () => checkboxRecipe.resolve(recipeProps, state);
        return (
          <box {...styles().root}>
            <CheckboxPrimitive.Indicator>
              <text content="✓" {...styles().indicator} />
            </CheckboxPrimitive.Indicator>
            <text content={local.label} {...styles().label} />
          </box>
        );
      }}
    </CheckboxPrimitive.Root>
  );
}
