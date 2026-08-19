import { UiProgressIndicatorElementDefinition } from "bedrock-energistics-core-api";
import { system } from "@minecraft/server";
import { WORKING_ICON_DESCRIPTION, WorkingIconState } from "../icons";
import { ICON_TILE_REDIRECTS, TRANSPARENT_ICON_TILES } from "../tiled_icons";

/**
 * Stands in for a fully transparent icon tile, which the `tiled_icons` build
 * filter doesn't generate an item for because it renders as nothing.
 */
const EMPTY_ICON_TILE_ITEM = "fluffyalien_energisticscore:ui_empty_slot";

/**
 * The amount of ticks each state of an animated tiled icon is shown for.
 * @remarks
 * Machine UIs are updated every 4 ticks, so this should be a multiple of 4.
 */
const ANIMATION_TICKS_PER_STATE = 8;

/**
 * The frames of the animated double arrow, in frame order.
 */
const DOUBLE_ARROW_RIGHT_ICONS = [
  "double_arrow_right_0",
  "double_arrow_right_1",
  "double_arrow_right_2",
];

/**
 * The highest frame index of the long arrow. The `tiled_icons` build filter generates
 * one frame per pixel column of the icon, so this is its width.
 */
const LONG_ARROW_RIGHT_MAX_FRAME = 22;

/**
 * The frames of the long arrow, in frame order.
 */
const LONG_ARROW_RIGHT_ICONS = Array.from(
  { length: LONG_ARROW_RIGHT_MAX_FRAME + 1 },
  (_, frame) => `long_arrow_right_${frame.toString()}`,
);

/**
 * The highest frame index of the flame. The flame fills upwards, so the `tiled_icons`
 * build filter generates one frame per pixel row, making this its height.
 */
const FLAME_MAX_FRAME = 16;

/**
 * The frames of the flame, in frame order.
 */
const FLAME_ICONS = Array.from(
  { length: FLAME_MAX_FRAME + 1 },
  (_, frame) => `flame_${frame.toString()}`,
);

export interface TiledIconOptions {
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
   * The names of the tiled icons to use as the frames of each tile, in frame order.
   * @remarks
   * Every icon must be the same size as `tilesX` by `tilesY`.
   */
  icons: string[];
}

/**
 * The item ID to draw for one tile of a tiled icon.
 * @remarks
 * The `tiled_icons` build filter skips tiles that don't need an item of their own:
 * a fully transparent tile is drawn with {@link EMPTY_ICON_TILE_ITEM}, and a tile that
 * shares its texture with an earlier one is drawn with that tile's item.
 */
function iconTileItemId(icon: string, tileX: number, tileY: number): string {
  const shortId = `ui_${icon}_${tileX.toString()}_${tileY.toString()}`;

  if (TRANSPARENT_ICON_TILES.has(shortId)) {
    return EMPTY_ICON_TILE_ITEM;
  }

  return `fluffyalien_energistics:${ICON_TILE_REDIRECTS[shortId] ?? shortId}`;
}

/**
 * Generates the UI elements for each tile of a tiled icon. Tiled icons are
 * split into a grid of tiles by the `tiled_icons` build filter.
 */
export function createTiledIconElements({
  name,
  startIndex,
  tilesX,
  tilesY,
  icons,
}: TiledIconOptions): Record<string, UiProgressIndicatorElementDefinition> {
  const elements: Record<string, UiProgressIndicatorElementDefinition> = {};

  for (let tileY = 0; tileY < tilesY; tileY++) {
    for (let tileX = 0; tileX < tilesX; tileX++) {
      const tileIndex = tileY * tilesX + tileX;

      elements[name + tileIndex.toString()] = {
        type: "progressIndicator",
        index: startIndex + tileIndex,
        indicator: {
          frames: icons.map((icon) => iconTileItemId(icon, tileX, tileY)),
        },
      };
    }
  }

  return elements;
}

/**
 * Creates the `progressIndicators` update for each tile of a tiled icon, showing
 * the icon at the given frame index.
 * @see {@link createTiledIconElements}
 */
export function updateTiledIcon(
  { name, tilesX, tilesY }: TiledIconOptions,
  frame: number,
): Record<string, number> {
  const progressIndicators: Record<string, number> = {};

  for (let tileIndex = 0; tileIndex < tilesX * tilesY; tileIndex++) {
    progressIndicators[name + tileIndex.toString()] = frame;
  }

  return progressIndicators;
}

/**
 * Creates the `progressIndicators` update for each tile of a tiled icon, cycling
 * through every state of the icon if `animate` is true, otherwise showing state 0.
 * @remarks
 * All animated icons share the same timing, so they stay in sync with each other.
 * @see {@link createTiledIconElements}
 */
export function animateTiledIcon(
  options: TiledIconOptions,
  animate: boolean,
  ticksPerState = ANIMATION_TICKS_PER_STATE,
): Record<string, number> {
  return updateTiledIcon(
    options,
    animate
      ? Math.floor(system.currentTick / ticksPerState) % options.icons.length
      : 0,
  );
}

/**
 * Describes the animated double arrow, which occupies 2 slots: `startIndex` and
 * `startIndex + 1`.
 * @remarks
 * The JSON UI counterpart is `fluffyalien_energistics:common.icon_2x1`, or
 * `common.transfer_indicator` to draw a status icon below it as well. Most machines
 * want {@link createTransferIndicator} rather than this on its own; reach for this when
 * the icon below the arrow isn't the working icon, as with a fuel burner's flame.
 */
export function createDoubleArrow(
  name: string,
  startIndex: number,
): TiledIconOptions {
  return {
    name: `${name}Arrow`,
    startIndex,
    tilesX: 2,
    tilesY: 1,
    icons: DOUBLE_ARROW_RIGHT_ICONS,
  };
}

/**
 * An icon that indicates whether the machine is working, occupying 1 slot.
 * @see {@link createWorkingIcon}
 */
export interface WorkingIcon {
  elementId: string;
  index: number;
}

/**
 * Describes a working icon.
 * @remarks
 * The JSON UI counterpart is `fluffyalien_energistics:common.working_icon`, or
 * `common.transfer_indicator` to draw it below a double arrow.
 */
export function createWorkingIcon(name: string, index: number): WorkingIcon {
  return {
    elementId: `${name}WorkingIcon`,
    index,
  };
}

/**
 * Generates the UI element for a working icon.
 * @see {@link createWorkingIcon}
 */
export function createWorkingIconElements({
  elementId,
  index,
}: WorkingIcon): Record<string, UiProgressIndicatorElementDefinition> {
  return {
    [elementId]: {
      type: "progressIndicator",
      index,
      indicator: WORKING_ICON_DESCRIPTION,
    },
  };
}

/**
 * Creates the `progressIndicators` update for a working icon.
 * @see {@link createWorkingIcon}
 */
export function updateWorkingIcon(
  { elementId }: WorkingIcon,
  working: boolean,
): Record<string, number> {
  return {
    [elementId]: working ? WorkingIconState.On : WorkingIconState.Off,
  };
}

/**
 * A double arrow with a working icon below it, which indicates a transfer with no
 * specific progress value.
 * @see {@link createTransferIndicator}
 */
export interface TransferIndicator {
  arrow: TiledIconOptions;
  workingIcon: WorkingIcon;
}

/**
 * Describes a transfer indicator, which occupies 3 slots: `startIndex` and
 * `startIndex + 1` are the double arrow, `startIndex + 2` is the working icon.
 * @remarks
 * The JSON UI counterpart is `fluffyalien_energistics:common.transfer_indicator`.
 * Use this for machines that convert one storage type into another every tick. If
 * the machine has an actual progress value, use the `arrow` progress indicator
 * preset instead.
 */
export function createTransferIndicator(
  name: string,
  startIndex: number,
): TransferIndicator {
  const arrow = createDoubleArrow(name, startIndex);

  return {
    arrow,
    workingIcon: createWorkingIcon(
      name,
      arrow.startIndex + arrow.tilesX * arrow.tilesY,
    ),
  };
}

/**
 * Generates the UI elements for each slot of a transfer indicator.
 * @see {@link createTransferIndicator}
 */
export function createTransferIndicatorElements({
  arrow,
  workingIcon,
}: TransferIndicator): Record<string, UiProgressIndicatorElementDefinition> {
  return {
    ...createTiledIconElements(arrow),
    ...createWorkingIconElements(workingIcon),
  };
}

/**
 * Creates the `progressIndicators` update for a transfer indicator, animating the
 * arrow and turning the working icon on if `working` is true, otherwise showing
 * both in their inactive state.
 * @see {@link createTransferIndicator}
 */
export function updateTransferIndicator(
  { arrow, workingIcon }: TransferIndicator,
  working: boolean,
): Record<string, number> {
  return {
    ...animateTiledIcon(arrow, working),
    ...updateWorkingIcon(workingIcon, working),
  };
}

/**
 * Describes a long arrow that fills up to show how far along a machine is, occupying 2
 * slots: `startIndex` and `startIndex + 1`.
 * @remarks
 * The JSON UI counterpart is `fluffyalien_energistics:common.icon_2x1`. Use this for
 * machines that have an actual progress value. For a machine that either runs or
 * doesn't, use {@link createTransferIndicator} instead.
 */
export function createProgressArrow(
  name: string,
  startIndex: number,
): TiledIconOptions {
  return {
    name: `${name}Arrow`,
    startIndex,
    tilesX: 2,
    tilesY: 1,
    icons: LONG_ARROW_RIGHT_ICONS,
  };
}

/**
 * Describes the flame that shows how far through its fuel a burner is, occupying 1 slot.
 * @remarks
 * The JSON UI counterpart is `fluffyalien_energistics:common.icon_1x1`, or the status
 * icon of a `common.transfer_indicator` to draw it below a double arrow. The art is
 * narrower than a full tile, so a transfer indicator holding one needs its
 * `$status_icon_offset` set to line the flame up under the arrow.
 */
export function createProgressFlame(
  name: string,
  index: number,
): TiledIconOptions {
  return {
    name: `${name}Flame`,
    startIndex: index,
    tilesX: 1,
    tilesY: 1,
    icons: FLAME_ICONS,
  };
}

/**
 * Creates the `progressIndicators` update for a progress icon, filled to show `progress`
 * out of `maxProgress`.
 * @see {@link createProgressArrow}
 * @see {@link createProgressFlame}
 */
export function updateProgressIcon(
  options: TiledIconOptions,
  progress: number,
  maxProgress: number,
): Record<string, number> {
  const maxFrame = options.icons.length - 1;
  const frame =
    maxProgress > 0 ? Math.floor((progress / maxProgress) * maxFrame) : 0;

  return updateTiledIcon(options, Math.min(Math.max(frame, 0), maxFrame));
}
