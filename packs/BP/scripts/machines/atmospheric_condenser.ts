import {
  generate,
  getMachineStorage,
  MachineDefinition,
  MAX_MACHINE_STORAGE,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MACHINE_TICK_INTERVAL } from "../constants";
import { BlockStateAccessor } from "../utils/block";

type GasStateValue = "hydrogen" | "carbon" | "nitrogen" | "none";

const ENERGY_CONSUMPTION = 100;
const ENERGY_CONSUMPTION_PER_TICK = ENERGY_CONSUMPTION / MACHINE_TICK_INTERVAL;

const GAS_GENERATION = 2;
const GAS_GENERATION_PER_TICK = GAS_GENERATION / MACHINE_TICK_INTERVAL;

const GAS_TYPES: Record<string, GasStateValue> = {
  "minecraft:overworld": "nitrogen",
  "minecraft:nether": "carbon",
  "minecraft:the_end": "hydrogen",
};

export const atmosphericCondenserMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:atmospheric_condenser",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
        outputGasBar: {
          type: "storageBar",
          startIndex: 4,
        },
      },
    },
  },
  handlers: {
    updateUi(location) {
      const gasStateValue =
        location.dimension
          .getBlock(location)
          ?.permutation.getState("fluffyalien_energistics:gas") ?? "none";

      const isActive = gasStateValue !== "none";

      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: isActive ? -ENERGY_CONSUMPTION_PER_TICK : 0,
          },
          {
            element: "outputGasBar",
            type: GAS_TYPES[location.dimension.id],
            change: isActive ? GAS_GENERATION_PER_TICK : 0,
          },
        ],
      };
    },
  },
};

export const atmosphericCondenserComponent: BlockCustomComponent = {
  onTick(e) {
    const gasState = new BlockStateAccessor<GasStateValue>(
      e.block,
      "fluffyalien_energistics:gas",
    );

    const gasType = GAS_TYPES[e.dimension.id];

    const storedEnergy = getMachineStorage(e.block, "energy");
    const storedGas = getMachineStorage(e.block, gasType);

    if (
      storedEnergy < ENERGY_CONSUMPTION ||
      storedGas + GAS_GENERATION >= MAX_MACHINE_STORAGE
    ) {
      generate(e.block, gasType, 0);
      gasState.set("none");
      return;
    }

    setMachineStorage(e.block, "energy", storedEnergy - ENERGY_CONSUMPTION);
    generate(e.block, gasType, GAS_GENERATION);

    gasState.set(gasType);
  },
};
