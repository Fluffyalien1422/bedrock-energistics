import { generate, MachineDefinition } from "@/becore_api";
import { VECTOR3_UP, Vector3Utils } from "@minecraft/math";
import {
  BlockCustomComponent,
  DimensionLocation,
  WeatherType,
  world,
} from "@minecraft/server";

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

  if (world.getTimeOfDay() > 12000) {
    return 0;
  }

  return location.dimension.getWeather() === WeatherType.Clear ? 2 : 1;
}

export const solarPanelMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:solar_panel",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
      },
    },
  },
  handlers: {
    updateUi(location) {
      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: getGeneration(location),
          },
        ],
      };
    },
  },
};

export const solarPanelComponent: BlockCustomComponent = {
  onTick({ block }) {
    generate(block, "energy", getGeneration(block));
  },
};
