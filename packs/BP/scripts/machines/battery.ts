import { BlockCustomComponent } from "@minecraft/server";
import {
  generate,
  getMachineStorage,
  MachineDefinition,
  StandardStorageType,
} from "bedrock-energistics-core-api";
import { BlockStateAccessor } from "../utils/block";

const AMOUNT_PER_STAGE = 2500;
const MAX_STORAGE = AMOUNT_PER_STAGE * 3;
const STAGE_AMOUNT_PADDING = 200;

export const batteryMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:battery",
    maxStorage: MAX_STORAGE,
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: StandardStorageType.Energy,
          },
        },
      },
    },
  },
};

export const batteryComponent: BlockCustomComponent = {
  onTick(e) {
    const stageState = new BlockStateAccessor<number>(
      e.block,
      "fluffyalien_energistics:stage",
    );

    const stored = getMachineStorage(e.block, StandardStorageType.Energy);

    if (stored <= 0) {
      stageState.set(0);
    } else {
      stageState.set(
        Math.max(
          Math.floor((stored + STAGE_AMOUNT_PADDING) / AMOUNT_PER_STAGE),
          1,
        ),
      );
    }

    generate(e.block, StandardStorageType.Energy, 0);
  },
};
