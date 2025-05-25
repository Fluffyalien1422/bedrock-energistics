import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { blockLocationToUid } from "../utils/location";
import {
  BlockComponentTickEvent,
  BlockCustomComponent,
} from "@minecraft/server";
import { BlockStateAccessor } from "../utils/block";
import {
  decrementMachineSlot,
  getInputItemWithHopperSupport,
} from "../utils/item";
import { MAX_MACHINE_STORAGE } from "../constants";

const ENERGY_CONSUMPTION = 1; // per progress
const LAVA_GENERATION = 32; // on completion
const MAX_PROGRESS = 32;
const INPUT_ALLOWED_ITEMS = ["minecraft:cobblestone"];

const progressMap = new Map<string, number>();

export const crucibleMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:crucible",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "energy",
          },
        },
        lavaBar: {
          type: "storageBar",
          startIndex: 4,
          defaults: {
            type: "lava",
          },
        },
        inputSlot: {
          type: "itemSlot",
          index: 8,
          allowedItems: INPUT_ALLOWED_ITEMS,
        },
        progressIndicator: {
          type: "progressIndicator",
          indicator: "arrow",
          index: 9,
        },
      },
    },
  },
  handlers: {
    updateUi(e) {
      const uid = blockLocationToUid(e.blockLocation);

      return {
        progressIndicators: {
          progressIndicator: Math.floor((progressMap.get(uid) ?? 0) / 2),
        },
      };
    },
  },
};

async function onTickAsync(e: BlockComponentTickEvent): Promise<void> {
  const uid = blockLocationToUid(e.block);
  const workingState = new BlockStateAccessor<boolean>(
    e.block,
    "fluffyalien_energistics:working",
  );
  const inputItem = await getInputItemWithHopperSupport(
    e.block,
    "inputSlot",
    INPUT_ALLOWED_ITEMS,
  );
  if (!inputItem) {
    progressMap.delete(uid);
    workingState.set(false);
    generate(e.block, "lava", 0);
    return;
  }
  const progress = progressMap.get(uid) ?? 0;
  const storedEnergy = getMachineStorage(e.block, "energy");
  const storedLava = getMachineStorage(e.block, "lava");

  if (
    storedEnergy < ENERGY_CONSUMPTION * (MAX_PROGRESS - progress) ||
    storedLava + LAVA_GENERATION > MAX_MACHINE_STORAGE
  ) {
    progressMap.delete(uid);
    workingState.set(false);
    generate(e.block, "lava", 0);
    return;
  }

  if (progress >= MAX_PROGRESS) {
    decrementMachineSlot(e.block, "inputSlot", inputItem);
    generate(e.block, "lava", LAVA_GENERATION);
    progressMap.delete(uid);
    return;
  }

  progressMap.set(uid, progress + 1);
  void setMachineStorage(e.block, "energy", storedEnergy - ENERGY_CONSUMPTION);
  generate(e.block, "lava", 0);

  workingState.set(true);
}

export const crucibleComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
