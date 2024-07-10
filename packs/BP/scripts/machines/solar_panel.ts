import { generate, RegisterMachineOptions } from "@/becore_api";
import { VECTOR3_UP, Vector3Utils } from "@minecraft/math";
import { BlockCustomComponent, WeatherType, world } from "@minecraft/server";

export const solarPanelMachine: RegisterMachineOptions = {
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
    updateUi() {
      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: 1,
          },
        ],
      };
    },
  },
};

export const solarPanelComponent: BlockCustomComponent = {
  onTick({ block, dimension }) {
    if (
      dimension.id !== "minecraft:overworld" ||
      dimension.getBlockFromRay(
        Vector3Utils.add(block.location, VECTOR3_UP),
        VECTOR3_UP,
        { includeLiquidBlocks: true },
      )
    ) {
      return 0;
    }

    if (world.getTimeOfDay() > 12000) {
      return 0;
    }

    const generation = dimension.getWeather() === WeatherType.Clear ? 2 : 1;

    generate(block, "energy", generation);
  },
};
