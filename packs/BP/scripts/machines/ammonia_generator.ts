import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
  StandardStorageType,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MACHINE_TICK_INTERVAL, MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor } from "../utils/block";

const AMMONIA_CONSUMPTION = 1;
const AMMONIA_CONSUMPTION_PER_TICK =
  AMMONIA_CONSUMPTION / MACHINE_TICK_INTERVAL;
const ENERGY_GENERATION = 65;
const ENERGY_GENERATION_PER_TICK = ENERGY_GENERATION / MACHINE_TICK_INTERVAL;

export const ammoniaGeneratorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:ammonia_generator",
    ui: {
      elements: {
        ammoniaBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "ammonia",
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
  handlers: {
    updateUi({ blockLocation }) {
      const block = blockLocation.dimension.getBlock(blockLocation);
      const working = block?.permutation.getState(
        "fluffyalien_energistics:working",
      );

      if (!working) return {};

      return {
        storageBars: {
          ammoniaBar: {
            change: -AMMONIA_CONSUMPTION_PER_TICK,
          },
          energyBar: {
            change: ENERGY_GENERATION_PER_TICK,
          },
        },
      };
    },
  },
};

export const ammoniaGeneratorComponent: BlockCustomComponent = {
  onTick({ block }) {
    const workingState = new BlockStateAccessor<boolean>(
      block,
      "fluffyalien_energistics:working",
    );

    const storedAmmonia = getMachineStorage(block, StandardStorageType.Ammonia);
    const storedEnergy = getMachineStorage(block, StandardStorageType.Energy);

    if (
      storedAmmonia < AMMONIA_CONSUMPTION ||
      storedEnergy + ENERGY_GENERATION > MAX_MACHINE_STORAGE
    ) {
      generate(block, StandardStorageType.Energy, 0);
      workingState.set(false);
      return;
    }

    setMachineStorage(
      block,
      StandardStorageType.Ammonia,
      storedAmmonia - AMMONIA_CONSUMPTION,
    );
    generate(block, StandardStorageType.Energy, ENERGY_GENERATION);

    workingState.set(true);
  },
};
