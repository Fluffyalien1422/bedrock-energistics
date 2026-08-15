import { generate, MachineDefinition } from "bedrock-energistics-core-api";
import { VECTOR3_UP, Vector3Utils } from "@minecraft/math";
import {
  BlockCustomComponent,
  DimensionLocation,
  world,
} from "@minecraft/server";
import {
  createTiledIconElements,
  createTransferIndicator,
  createTransferIndicatorElements,
  TiledIconOptions,
  updateTiledIcon,
  updateTransferIndicator,
} from "../utils/ui";

const MIN_TIME = 12000;

// must match the order of the icons in TIME_ICON
enum TimeIconState {
  Sun,
  Moon,
}

const TIME_ICON: TiledIconOptions = {
  name: "timeIcon",
  startIndex: 0,
  tilesX: 3,
  tilesY: 4,
  icons: ["sun_icon", "moon_icon"],
};

const TRANSFER_INDICATOR = createTransferIndicator("transfer", 12);

function isDay(): boolean {
  return world.getTimeOfDay() < MIN_TIME;
}

function getGeneration(location: DimensionLocation): number {
  if (
    location.dimension.id !== "minecraft:overworld" ||
    location.dimension.getBlockFromRay(
      Vector3Utils.add(location, VECTOR3_UP),
      VECTOR3_UP,
      { includeLiquidBlocks: true },
    )
  ) {
    return 0;
  }

  if (!isDay()) {
    return 0;
  }

  return 5;
}

export const solarPanelMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:solar_panel",
    ui: {
      elements: {
        // slots 0-11
        ...createTiledIconElements(TIME_ICON),
        // slots 12-14
        ...createTransferIndicatorElements(TRANSFER_INDICATOR),
        // slots 15-18
        energyBar: {
          type: "storageBar",
          startIndex: 15,
          defaults: {
            type: "energy",
          },
        },
      },
    },
  },
  handlers: {
    updateUi({ blockLocation }) {
      const working = getGeneration(blockLocation) > 0;

      return {
        progressIndicators: {
          ...updateTiledIcon(
            TIME_ICON,
            isDay() ? TimeIconState.Sun : TimeIconState.Moon,
          ),
          ...updateTransferIndicator(TRANSFER_INDICATOR, working),
        },
      };
    },
  },
};

export const solarPanelComponent: BlockCustomComponent = {
  onTick({ block }) {
    generate(block, "energy", getGeneration(block));
  },
};
