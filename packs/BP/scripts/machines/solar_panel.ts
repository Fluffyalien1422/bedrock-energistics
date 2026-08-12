import { generate, MachineDefinition } from "bedrock-energistics-core-api";
import { VECTOR3_UP, Vector3Utils } from "@minecraft/math";
import {
  BlockCustomComponent,
  DimensionLocation,
  world,
} from "@minecraft/server";
import {
  animateSpecialIcon,
  createSpecialIconElements,
  SpecialIconOptions,
  updateSpecialIcon,
} from "../utils/ui";
import { WORKING_ICON_DESCRIPTION, WorkingIconState } from "../icons";

const MIN_TIME = 12000;

// must match the order of the icons in TIME_ICON
enum TimeIconState {
  Sun,
  Moon,
}

const TIME_ICON: SpecialIconOptions = {
  name: "timeIcon",
  startIndex: 0,
  tilesX: 3,
  tilesY: 4,
  icons: ["sun_icon", "moon_icon"],
};

const ARROW_ICON: SpecialIconOptions = {
  name: "arrowIcon",
  startIndex: 12,
  tilesX: 2,
  tilesY: 1,
  icons: [
    "double_arrow_right_0",
    "double_arrow_right_1",
    "double_arrow_right_2",
  ],
};

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
        ...createSpecialIconElements(TIME_ICON),
        // slots 12-13
        ...createSpecialIconElements(ARROW_ICON),
        // slot 14
        energyIcon: {
          type: "progressIndicator",
          index: 14,
          indicator: WORKING_ICON_DESCRIPTION,
        },
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
          ...updateSpecialIcon(
            TIME_ICON,
            isDay() ? TimeIconState.Sun : TimeIconState.Moon,
          ),
          ...animateSpecialIcon(ARROW_ICON, working),
          energyIcon: working ? WorkingIconState.On : WorkingIconState.Off,
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
