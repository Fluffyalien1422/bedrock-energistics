import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MACHINE_TICK_INTERVAL, MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor } from "../utils/block";

const OIL_CONSUMPTION = 2;
const OIL_CONSUMPTION_PER_TICK = OIL_CONSUMPTION / MACHINE_TICK_INTERVAL;
const ENERGY_GENERATION = 20;
const ENERGY_GENERATION_PER_TICK = ENERGY_GENERATION / MACHINE_TICK_INTERVAL;

export const oilGeneratorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:oil_generator",
    ui: {
      elements: {
        oilBar: {
          type: "storageBar",
          startIndex: 0,
        },
        energyBar: {
          type: "storageBar",
          startIndex: 4,
        },
      },
    },
  },
  handlers: {
    updateUi({ blockLocation: location }) {
      const block = location.dimension.getBlock(location);
      const working = block?.permutation.getState(
        "fluffyalien_energistics:working",
      );

      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: working ? ENERGY_GENERATION_PER_TICK : 0,
          },
          {
            element: "oilBar",
            type: "oil",
            change: working ? -OIL_CONSUMPTION_PER_TICK : 0,
          },
        ],
      };
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

    if (storedOil < OIL_CONSUMPTION || storedEnergy >= MAX_MACHINE_STORAGE) {
      generate(e.block, "energy", 0);
      workingState.set(false);
      return;
    }

    setMachineStorage(e.block, "oil", storedOil - OIL_CONSUMPTION);
    generate(e.block, "energy", ENERGY_GENERATION);

    workingState.set(true);
  },
};
