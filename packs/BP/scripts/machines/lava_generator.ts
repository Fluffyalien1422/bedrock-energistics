import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor, isMachineWorking } from "../utils/block";
import {
  createTransferIndicator,
  createTransferIndicatorElements,
  updateTransferIndicator,
} from "../utils/ui";

const LAVA_CONSUMPTION = 2;
const ENERGY_GENERATION = 30;

const TRANSFER_INDICATOR = createTransferIndicator("transfer", 8);

export const lavaGeneratorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:lava_generator",
    ui: {
      elements: {
        lavaBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "lava",
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

export const lavaGeneratorComponent: BlockCustomComponent = {
  onTick(e) {
    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    const storedLava = getMachineStorage(e.block, "lava");
    const storedEnergy = getMachineStorage(e.block, "energy");

    if (
      storedLava < LAVA_CONSUMPTION ||
      storedEnergy + ENERGY_GENERATION > MAX_MACHINE_STORAGE
    ) {
      generate(e.block, "energy", 0);
      workingState.set(false);
      return;
    }

    void setMachineStorage(e.block, "lava", storedLava - LAVA_CONSUMPTION);
    generate(e.block, "energy", ENERGY_GENERATION);

    workingState.set(true);
  },
};
