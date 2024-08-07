import {
  getMachineStorage,
  MachineDefinition,
  MAX_MACHINE_STORAGE,
  setMachineStorage,
} from "@/becore_api";
import { BlockCustomComponent } from "@minecraft/server";
import { MACHINE_TICK_INTERVAL } from "../constants";
import { BlockStateAccessor } from "../utils/block";

const OIL_GENERATION = 5;
const OIL_GENERATION_PER_TICK = OIL_GENERATION / MACHINE_TICK_INTERVAL;
const ENERGY_CONSUMPTION = 10;
const ENERGY_CONSUMPTION_PER_TICK = ENERGY_CONSUMPTION / MACHINE_TICK_INTERVAL;

export const oilExtractorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:oil_extractor",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
        oilBar: {
          type: "storageBar",
          startIndex: 4,
        },
      },
    },
  },
  handlers: {
    updateUi(location) {
      const block = location.dimension.getBlock(location);
      const working = block?.permutation.getState(
        "fluffyalien_energistics:working",
      );

      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: working ? -ENERGY_CONSUMPTION_PER_TICK : 0,
          },
          {
            element: "oilBar",
            type: "oil",
            change: working ? OIL_GENERATION_PER_TICK : 0,
          },
        ],
      };
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

    if (storedEnergy < ENERGY_CONSUMPTION) {
      workingState.set(false);
      return;
    }

    const storedOil = getMachineStorage(e.block, "oil");

    if (storedOil >= MAX_MACHINE_STORAGE) {
      workingState.set(false);
      return;
    }

    setMachineStorage(e.block, "energy", storedEnergy - ENERGY_CONSUMPTION);
    setMachineStorage(e.block, "oil", storedOil + OIL_GENERATION);

    workingState.set(true);
  },
};
