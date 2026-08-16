import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import {
  ATMOSPHERIC_CONDENSER_ENERGY_CONSUMPTION as ENERGY_CONSUMPTION,
  ATMOSPHERIC_CONDENSER_GAS_GENERATION as GAS_GENERATION,
  MAX_MACHINE_STORAGE,
} from "../balance";
import { BlockStateAccessor, isMachineWorking } from "../utils/block";
import { BlockStateSuperset } from "@minecraft/vanilla-data";
import {
  createTransferIndicator,
  createTransferIndicatorElements,
  updateTransferIndicator,
} from "../utils/ui";

type GasStateValue = "hydrogen" | "carbon" | "nitrogen";

const GAS_TYPES: Record<string, GasStateValue> = {
  "minecraft:overworld": "nitrogen",
  "minecraft:nether": "carbon",
  "minecraft:the_end": "hydrogen",
};

const TRANSFER_INDICATOR = createTransferIndicator("transfer", 8);

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
        // slots 8-10
        ...createTransferIndicatorElements(TRANSFER_INDICATOR),
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
        progressIndicators: updateTransferIndicator(
          TRANSFER_INDICATOR,
          isMachineWorking(location),
        ),
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
