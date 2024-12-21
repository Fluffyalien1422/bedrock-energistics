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

const FLUID_GENERATION = 10;
const FLUID_GENERATION_PER_TICK = FLUID_GENERATION / MACHINE_TICK_INTERVAL;
const ENERGY_CONSUMPTION = 10;
const ENERGY_CONSUMPTION_PER_TICK = ENERGY_CONSUMPTION / MACHINE_TICK_INTERVAL;

export const pumpMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:pump",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: StandardStorageType.Energy,
          },
        },
        outBar: {
          type: "storageBar",
          startIndex: 4,
        },
      },
    },
  },
  handlers: {
    updateUi(e) {
      const block = e.blockLocation.dimension.getBlock(e.blockLocation);
      const type = block?.permutation.getState(
        "fluffyalien_energistics:type",
      ) as string | undefined;

      if (!type || type === "none") {
        return {};
      }

      const working = block?.permutation.getState(
        "fluffyalien_energistics:working",
      ) as boolean;

      return {
        storageBars: {
          energyBar: {
            change: working ? -ENERGY_CONSUMPTION_PER_TICK : 0,
          },
          outBar: {
            type,
            change: working ? FLUID_GENERATION_PER_TICK : 0,
          },
        },
      };
    },
  },
};

export const pumpComponent: BlockCustomComponent = {
  onTick(e) {
    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    const typeState = new BlockStateAccessor<string>(
      e.block,
      "fluffyalien_energistics:type",
    );

    const blockBelow = e.block.below();

    switch (blockBelow?.typeId) {
      case "minecraft:water":
      case "minecraft:flowing_water":
        typeState.set("water");
        break;
      case "minecraft:lava":
      case "minecraft:flowing_lava":
        typeState.set("lava");
        break;
      default:
        typeState.set("none");
        workingState.set(false);
        return;
    }

    const type = typeState.get();

    const storedEnergy = getMachineStorage(e.block, StandardStorageType.Energy);
    const storedOutput = getMachineStorage(e.block, type);

    if (
      storedEnergy < ENERGY_CONSUMPTION ||
      storedOutput + FLUID_GENERATION > MAX_MACHINE_STORAGE
    ) {
      generate(e.block, type, 0);
      workingState.set(false);
      return;
    }

    setMachineStorage(
      e.block,
      StandardStorageType.Energy,
      storedEnergy - ENERGY_CONSUMPTION,
    );
    generate(e.block, type, FLUID_GENERATION);

    workingState.set(true);
  },
};
