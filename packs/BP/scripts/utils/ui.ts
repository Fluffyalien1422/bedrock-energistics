import { UiProgressIndicatorElementDefinition } from "bedrock-energistics-core-api";
import { system } from "@minecraft/server";

/**
 * The amount of ticks each state of an animated special icon is shown for.
 * @remarks
 * Machine UIs are updated every 4 ticks, so this should be a multiple of 4.
 */
const ANIMATION_TICKS_PER_STATE = 8;

export interface SpecialIconOptions {
  /**
   * The base name of the generated elements.
   * @remarks
   * Each element is named `${name}${tileIndex}`, where the tile index counts
   * up from 0 in rows, starting with the top left tile.
   */
  name: string;
  /**
   * The slot index of the top left tile. The rest of the tiles follow it in rows.
   */
  startIndex: number;
  /**
   * The width of the icon in tiles.
   */
  tilesX: number;
  /**
   * The height of the icon in tiles.
   */
  tilesY: number;
  /**
   * The names of the special icons to use as the frames of each tile, in frame order.
   * @remarks
   * Every icon must be the same size as `tilesX` by `tilesY`.
   */
  icons: string[];
}

/**
 * Generates the UI elements for each tile of a special icon. Special icons are
 * split into a grid of tiles by the `ui_composite` build filter.
 */
export function createSpecialIconElements({
  name,
  startIndex,
  tilesX,
  tilesY,
  icons,
}: SpecialIconOptions): Record<string, UiProgressIndicatorElementDefinition> {
  const elements: Record<string, UiProgressIndicatorElementDefinition> = {};

  for (let tileY = 0; tileY < tilesY; tileY++) {
    for (let tileX = 0; tileX < tilesX; tileX++) {
      const tileIndex = tileY * tilesX + tileX;

      elements[name + tileIndex.toString()] = {
        type: "progressIndicator",
        index: startIndex + tileIndex,
        indicator: {
          frames: icons.map(
            (icon) =>
              `fluffyalien_energistics:ui_${icon}_${tileX.toString()}_${tileY.toString()}`,
          ),
        },
      };
    }
  }

  return elements;
}

/**
 * Creates the `progressIndicators` update for each tile of a special icon, showing
 * the icon at the given frame index.
 * @see {@link createSpecialIconElements}
 */
export function updateSpecialIcon(
  { name, tilesX, tilesY }: SpecialIconOptions,
  frame: number,
): Record<string, number> {
  const progressIndicators: Record<string, number> = {};

  for (let tileIndex = 0; tileIndex < tilesX * tilesY; tileIndex++) {
    progressIndicators[name + tileIndex.toString()] = frame;
  }

  return progressIndicators;
}

/**
 * Creates the `progressIndicators` update for each tile of a special icon, cycling
 * through every state of the icon if `animate` is true, otherwise showing state 0.
 * @remarks
 * All animated icons share the same timing, so they stay in sync with each other.
 * @see {@link createSpecialIconElements}
 */
export function animateSpecialIcon(
  options: SpecialIconOptions,
  animate: boolean,
  ticksPerState = ANIMATION_TICKS_PER_STATE,
): Record<string, number> {
  return updateSpecialIcon(
    options,
    animate
      ? Math.floor(system.currentTick / ticksPerState) % options.icons.length
      : 0,
  );
}
