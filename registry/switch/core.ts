import {
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import {
  SwitchRootRenderable,
  SwitchStore,
  SwitchThumbRenderable,
} from "@opentui-ui/core/switch";

export interface SwitchOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  density?: "compact" | "comfortable";
  disabled?: boolean;
  label: string;
  onCheckedChange?: (checked: boolean) => void;
  symbols?: "round" | "ascii";
}

const symbolSets = {
  round: { thumb: "●", track: "─" },
  ascii: { thumb: "*", track: "-" },
} as const;

class SwitchRecipeRenderable extends SwitchRootRenderable {
  private readonly unsubscribeRecipe: () => void;

  constructor(ctx: RenderContext, options: SwitchOptions) {
    const store = new SwitchStore(options);
    const trackWidth = options.density === "comfortable" ? 5 : 3;
    const symbols = symbolSets[options.symbols ?? "round"];
    super(ctx, {
      store,
      backgroundColor: "transparent",
      flexDirection: "row",
      gap: options.density === "comfortable" ? 2 : 1,
    });

    const track = new BoxRenderable(ctx, {
      backgroundColor: "transparent",
      height: 1,
      position: "relative",
      width: trackWidth,
    });
    track.add(
      new TextRenderable(ctx, {
        content: symbols.track.repeat(trackWidth),
        fg: "#525252",
      }),
    );
    const thumb = new SwitchThumbRenderable(ctx, {
      store,
      height: 1,
      left: store.state.checked ? trackWidth - 1 : 0,
      position: "absolute",
      width: 1,
    });
    thumb.add(
      new TextRenderable(ctx, {
        content: symbols.thumb,
        fg: "#3B82F6",
      }),
    );
    track.add(thumb);
    this.add(track);
    this.add(
      new TextRenderable(ctx, {
        content: options.label,
        fg: options.disabled ? "#737373" : "#E5E5E5",
      }),
    );
    this.unsubscribeRecipe = store.subscribe((state) => {
      thumb.left = state.checked ? trackWidth - 1 : 0;
    });
  }

  override destroy(): void {
    this.unsubscribeRecipe();
    super.destroy();
  }
}

/** Consumer-owned imperative recipe using packaged Switch behavior. */
export function createSwitch(
  ctx: RenderContext,
  options: SwitchOptions,
): SwitchRootRenderable {
  return new SwitchRecipeRenderable(ctx, options);
}
