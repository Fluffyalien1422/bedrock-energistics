import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MACHINE_TICK_INTERVAL, MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor } from "../utils/block";

type GasStateValue = "hydrogen" | "carbon" | "nitrogen";

const ENERGY_CONSUMPTION = 50;
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
    updateUi({ blockLocation: location }) {
      const gasStateValue =
        location.dimension
          .getBlock(location)
          ?.permutation.getState("fluffyalien_energistics:gas") ?? "none";

      const isActive = gasStateValue !== "none";

      return {
        storageBars: {
          energyBar: {
            type: "energy",
            change: isActive ? -ENERGY_CONSUMPTION_PER_TICK : 0,
          },
          outputGasBar: {
            type: GAS_TYPES[location.dimension.id],
            change: isActive ? GAS_GENERATION_PER_TICK : 0,
          },
        },
      };
    },
  },
};

export const atmosphericCondenserComponent: BlockCustomComponent = {
  beforeOnPlayerPlace(e) {
    e.permutationToPlace = e.permutationToPlace.withState(
      "fluffyalien_energistics:gas",
      GAS_TYPES[e.dimension.id],
    );
  },

  onTick(e) {
    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    const gasType = GAS_TYPES[e.dimension.id];

    const storedEnergy = getMachineStorage(e.block, "energy");
    const storedGas = getMachineStorage(e.block, gasType);

    if (
      storedEnergy < ENERGY_CONSUMPTION ||
      storedGas + GAS_GENERATION > MAX_MACHINE_STORAGE
    ) {
      generate(e.block, gasType, 0);
      workingState.set(false);
      return;
    }

    setMachineStorage(e.block, "energy", storedEnergy - ENERGY_CONSUMPTION);
    generate(e.block, gasType, GAS_GENERATION);
    workingState.set(true);
  },
};
