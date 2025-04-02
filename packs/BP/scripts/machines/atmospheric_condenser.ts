import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor } from "../utils/block";
import { BlockStateSuperset } from "@minecraft/vanilla-data";

type GasStateValue = "hydrogen" | "carbon" | "nitrogen";

const ENERGY_CONSUMPTION = 50;
const GAS_GENERATION = 2;

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
          defaults: {
            type: "energy",
          },
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
      return {
        storageBars: {
          outputGasBar: {
            type: GAS_TYPES[location.dimension.id],
          },
        },
      };
    },
  },
};

export const atmosphericCondenserComponent: BlockCustomComponent = {
  beforeOnPlayerPlace(e) {
    e.permutationToPlace = e.permutationToPlace.withState(
      "fluffyalien_energistics:gas" as keyof BlockStateSuperset,
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

    void setMachineStorage(
      e.block,
      "energy",
      storedEnergy - ENERGY_CONSUMPTION,
    );
    generate(e.block, gasType, GAS_GENERATION);
    workingState.set(true);
  },
};
