import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import {
  MAX_MACHINE_STORAGE,
  OIL_EXTRACTOR_ENERGY_CONSUMPTION as ENERGY_CONSUMPTION,
  OIL_EXTRACTOR_OIL_GENERATION as OIL_GENERATION,
} from "../balance";
import { BlockStateAccessor, isMachineWorking } from "../utils/block";
import {
  createTransferIndicator,
  createTransferIndicatorElements,
  updateTransferIndicator,
} from "../utils/ui";

const TRANSFER_INDICATOR = createTransferIndicator("transfer", 8);

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
