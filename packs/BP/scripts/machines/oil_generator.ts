import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor } from "../utils/block";

const OIL_CONSUMPTION = 2;
const ENERGY_GENERATION = 30;

export const oilGeneratorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:oil_generator",
    ui: {
      elements: {
        oilBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "oil",
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

export const oilGeneratorComponent: BlockCustomComponent = {
  onTick(e) {
    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    const storedOil = getMachineStorage(e.block, "oil");
    const storedEnergy = getMachineStorage(e.block, "energy");

    if (
      storedOil < OIL_CONSUMPTION ||
      storedEnergy + ENERGY_GENERATION > MAX_MACHINE_STORAGE
    ) {
      generate(e.block, "energy", 0);
      workingState.set(false);
      return;
    }

    void setMachineStorage(e.block, "oil", storedOil - OIL_CONSUMPTION);
    generate(e.block, "energy", ENERGY_GENERATION);

    workingState.set(true);
  },
};
