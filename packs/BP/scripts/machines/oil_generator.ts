import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import {
  MAX_MACHINE_STORAGE,
  OIL_GENERATOR_ENERGY_GENERATION as ENERGY_GENERATION,
  OIL_GENERATOR_OIL_CONSUMPTION as OIL_CONSUMPTION,
} from "../balance";
import { BlockStateAccessor, isMachineWorking } from "../utils/block";
import {
  createTransferIndicator,
  createTransferIndicatorElements,
  updateTransferIndicator,
} from "../utils/ui";

const TRANSFER_INDICATOR = createTransferIndicator("transfer", 8);

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
        // slots 8-10
        ...createTransferIndicatorElements(TRANSFER_INDICATOR),
      },
    },
  },
  handlers: {
    updateUi({ blockLocation }) {
      return {
        progressIndicators: updateTransferIndicator(
          TRANSFER_INDICATOR,
          isMachineWorking(blockLocation),
        ),
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
