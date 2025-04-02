import {
  generate,
  getMachineStorage,
  MachineDefinition,
  MachineNetwork,
  MachineUpdateUiHandlerResponse,
  setMachineStorage,
  StandardStorageType,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor } from "../utils/block";
import { BlockStateSuperset } from "@minecraft/vanilla-data";

const ENERGY_CONSUMPTION = 50;
const FLUID_CONSUMPTION = 6;

interface FluidRecipeResult {
  type: StandardStorageType;
  amount: number;
}

const RECIPES: Record<string, [FluidRecipeResult, FluidRecipeResult]> = {
  oil: [
    {
      type: StandardStorageType.Hydrogen,
      amount: 4,
    },
    {
      type: StandardStorageType.Carbon,
      amount: 2,
    },
  ],
  water: [
    {
      type: StandardStorageType.Hydrogen,
      amount: 4,
    },
    {
      type: StandardStorageType.Oxygen,
      amount: 2,
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
    updateUi({ blockLocation }): MachineUpdateUiHandlerResponse {
      const block = blockLocation.dimension.getBlock(blockLocation);
      if (!block) return {};

      const fluid = block.permutation.getState(
        "fluffyalien_energistics:fluid" as keyof BlockStateSuperset,
      ) as string;

      if (fluid === "none") return {};

      const working = block.permutation.getState(
        "fluffyalien_energistics:working" as keyof BlockStateSuperset,
      ) as boolean;

      const recipeResults = RECIPES[fluid];

      const result1 = recipeResults[0];
      const result2 = recipeResults[1];

      if (!working) {
        return {
          storageBars: {
            inputBar: {
              type: fluid,
            },
            outputBar1: {
              type: result1.type,
            },
            outputBar2: {
              type: result2.type,
            },
          },
        };
      }

      return {
        storageBars: {
          inputBar: {
            type: fluid,
          },
          outputBar1: {
            type: result1.type,
          },
          outputBar2: {
            type: result2.type,
          },
        },
      };
    },
  },
};

export const fluidSeparatorComponent: BlockCustomComponent = {
  onTick({ block }) {
    const workingState = new BlockStateAccessor<boolean>(
      block,
      "fluffyalien_energistics:working",
    );

    const fluidState = new BlockStateAccessor<string>(
      block,
      "fluffyalien_energistics:fluid",
    );

    const fluid = fluidState.get();

    if (fluid === "none") {
      if (getMachineStorage(block, "oil")) {
        fluidState.set("oil");
        void MachineNetwork.updateWithBlock(block);
        void MachineNetwork.updateAdjacent(block);
      } else if (getMachineStorage(block, "water")) {
        fluidState.set("water");
        void MachineNetwork.updateWithBlock(block);
        void MachineNetwork.updateAdjacent(block);
      } else {
        workingState.set(false);
      }

      return;
    }

    const results = RECIPES[fluid];
    const result1 = results[0];
    const result2 = results[1];

    const storedEnergy = getMachineStorage(block, "energy");
    const storedFluid = getMachineStorage(block, fluid);
    const storedResult1 = getMachineStorage(block, result1.type);
    const storedResult2 = getMachineStorage(block, result2.type);

    if (
      storedEnergy < ENERGY_CONSUMPTION ||
      storedFluid < FLUID_CONSUMPTION ||
      storedResult1 + result1.amount > MAX_MACHINE_STORAGE ||
      storedResult2 + result2.amount > MAX_MACHINE_STORAGE
    ) {
      generate(block, result1.type, 0);
      generate(block, result2.type, 0);
      workingState.set(false);
      return;
    }

    void setMachineStorage(block, "energy", storedEnergy - ENERGY_CONSUMPTION);
    void setMachineStorage(block, fluid, storedFluid - FLUID_CONSUMPTION);

    generate(block, result1.type, result1.amount);
    generate(block, result2.type, result2.amount);

    workingState.set(true);
  },
};
