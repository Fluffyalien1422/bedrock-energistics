import {
  MachineDefinition,
  UpdateUiHandlerResponse,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MACHINE_TICK_INTERVAL } from "../constants";

const ENERGY_CONSUMPTION = 100;
const ENERGY_CONSUMPTION_PER_TICK = ENERGY_CONSUMPTION / MACHINE_TICK_INTERVAL;

const FLUID_CONSUMPTION = 10;
const FLUID_CONSUMPTION_PER_TICK = FLUID_CONSUMPTION / MACHINE_TICK_INTERVAL;

interface FluidRecipeResult {
  type: string;
  amount: number;
}

const RECIPES: Record<string, [FluidRecipeResult, FluidRecipeResult]> = {
  oil: [
    {
      type: "hydrogen",
      amount: 7,
    },
    {
      type: "carbon",
      amount: 3,
    },
  ],
};

export const fluidSeparatorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:fluid_separator",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "energy",
          },
        },
        inputBar: {
          type: "storageBar",
          startIndex: 4,
        },
        outputBar1: {
          type: "storageBar",
          startIndex: 8,
        },
        outputBar2: {
          type: "storageBar",
          startIndex: 12,
        },
      },
    },
  },
  handlers: {
    updateUi({ blockLocation }): UpdateUiHandlerResponse {
      const block = blockLocation.dimension.getBlock(blockLocation);
      if (!block) return {};

      const working = block.permutation.getState(
        "fluffyalien_energistics:working",
      ) as boolean;

      const fluid = block.permutation.getState(
        "fluffyalien_energistics:fluid",
      ) as string;

      if (!working) {
        return {
          storageBars: {
            inputBar: {
              type: fluid === "none" ? "_disabled" : fluid,
            },
          },
        };
      }

      const recipeResults = RECIPES[fluid];

      const result1 = recipeResults[0];
      const result2 = recipeResults[1];

      return {
        storageBars: {
          energyBar: {
            change: -ENERGY_CONSUMPTION_PER_TICK,
          },
          inputBar: {
            type: fluid,
            change: -FLUID_CONSUMPTION_PER_TICK,
          },
          outputBar1: {
            type: result1.type,
            change: result1.amount / MACHINE_TICK_INTERVAL,
          },
          outputBar2: {
            type: result2.type,
            change: result2.amount / MACHINE_TICK_INTERVAL,
          },
        },
      };
    },
  },
};

export const fluidSeparatorComponent: BlockCustomComponent = {
  onTick() {},
};
