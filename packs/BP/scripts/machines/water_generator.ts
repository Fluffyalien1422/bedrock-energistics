import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor } from "../utils/block";

const WATER_CONSUMPTION = 2;
const ENERGY_GENERATION = 30;

export const waterGeneratorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:water_generator",
    ui: {
      elements: {
        waterBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "water",
          },
        },
        energyBar: {
          type: "storageBar",
          startIndex: 4,
          defaults: {
            type: "energy",
          },
        },
      },
    },
  },
};

export const waterGeneratorComponent: BlockCustomComponent = {
  onTick(e) {
    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    const storedWater = getMachineStorage(e.block, "water");
    const storedEnergy = getMachineStorage(e.block, "energy");

    if (
      storedWater < WATER_CONSUMPTION ||
      storedEnergy + ENERGY_GENERATION > MAX_MACHINE_STORAGE
    ) {
      generate(e.block, "energy", 0);
      workingState.set(false);
      return;
    }

    void setMachineStorage(e.block, "water", storedWater - WATER_CONSUMPTION);
    generate(e.block, "energy", ENERGY_GENERATION);

    workingState.set(true);
  },
};
