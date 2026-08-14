import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
  StandardStorageType,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor, isMachineWorking } from "../utils/block";
import {
  createTransferIndicator,
  createTransferIndicatorElements,
  updateTransferIndicator,
} from "../utils/ui";

const AMMONIA_CONSUMPTION = 1;
const ENERGY_GENERATION = 65;

const TRANSFER_INDICATOR = createTransferIndicator("transfer", 8);

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

    void setMachineStorage(
      block,
      StandardStorageType.Ammonia,
      storedAmmonia - AMMONIA_CONSUMPTION,
    );
    generate(block, StandardStorageType.Energy, ENERGY_GENERATION);

    workingState.set(true);
  },
};
