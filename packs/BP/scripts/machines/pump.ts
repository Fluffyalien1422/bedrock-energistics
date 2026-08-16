import {
  generate,
  getMachineStorage,
  MachineDefinition,
  MachineNetwork,
  setMachineStorage,
  StandardStorageType,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import {
  MAX_MACHINE_STORAGE,
  PUMP_ENERGY_CONSUMPTION as ENERGY_CONSUMPTION,
  PUMP_FLUID_GENERATION as FLUID_GENERATION,
} from "../balance";
import { BlockStateAccessor, isMachineWorking } from "../utils/block";
import { BlockStateSuperset } from "@minecraft/vanilla-data";
import {
  createTransferIndicator,
  createTransferIndicatorElements,
  updateTransferIndicator,
} from "../utils/ui";

const TRANSFER_INDICATOR = createTransferIndicator("transfer", 8);

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
        // slots 8-10
        ...createTransferIndicatorElements(TRANSFER_INDICATOR),
      },
    },
  },
  handlers: {
    updateUi(e) {
      const block = e.blockLocation.dimension.getBlock(e.blockLocation);
      const type = block?.permutation.getState(
        "fluffyalien_energistics:type" as keyof BlockStateSuperset,
      ) as string | undefined;

      const progressIndicators = updateTransferIndicator(
        TRANSFER_INDICATOR,
        isMachineWorking(e.blockLocation),
      );

      if (!type || type === "none") {
        return { progressIndicators };
      }

      return {
        storageBars: {
          outBar: {
            type,
          },
        },
        progressIndicators,
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
        if (typeState.get() !== "water") {
          typeState.set("water");
          void MachineNetwork.updateWithBlock(e.block);
          void MachineNetwork.updateAdjacent(e.block);
          return;
        }
        break;
      case "minecraft:lava":
      case "minecraft:flowing_lava":
        if (typeState.get() !== "lava") {
          typeState.set("lava");
          void MachineNetwork.updateWithBlock(e.block);
          void MachineNetwork.updateAdjacent(e.block);
          return;
        }
        break;
      case undefined:
      default:
        workingState.set(false);
        if (typeState.get() !== "none") {
          typeState.set("none");
          void MachineNetwork.updateWithBlock(e.block);
          void MachineNetwork.updateAdjacent(e.block);
        }
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

    void setMachineStorage(
      e.block,
      StandardStorageType.Energy,
      storedEnergy - ENERGY_CONSUMPTION,
    );
    generate(e.block, type, FLUID_GENERATION);

    workingState.set(true);
  },
};
