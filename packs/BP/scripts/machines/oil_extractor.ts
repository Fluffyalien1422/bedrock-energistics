import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor } from "../utils/block";

const OIL_GENERATION = 10;
const ENERGY_CONSUMPTION = 10;

export const oilExtractorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:oil_extractor",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "energy",
          },
        },
        oilBar: {
          type: "storageBar",
          startIndex: 4,
          defaults: {
            type: "oil",
          },
        },
      },
    },
  },
};

export const oilExtractorComponent: BlockCustomComponent = {
  onTick(e) {
    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    const storedEnergy = getMachineStorage(e.block, "energy");
    const storedOil = getMachineStorage(e.block, "oil");

    if (
      storedEnergy < ENERGY_CONSUMPTION ||
      storedOil + OIL_GENERATION > MAX_MACHINE_STORAGE
    ) {
      generate(e.block, "oil", 0);
      workingState.set(false);
      return;
    }

    void setMachineStorage(
      e.block,
      "energy",
      storedEnergy - ENERGY_CONSUMPTION,
    );
    generate(e.block, "oil", OIL_GENERATION);

    workingState.set(true);
  },
};
