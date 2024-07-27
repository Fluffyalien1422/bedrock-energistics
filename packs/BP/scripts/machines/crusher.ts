import {
  getItemInMachineSlot,
  getMachineStorage,
  MachineDefinition,
  setItemInMachineSlot,
  setMachineStorage,
} from "@/becore_api";
import { blockLocationToUid } from "../utils/location";
import { MACHINE_TICK_INTERVAL } from "../constants";
import { BlockCustomComponent, ItemStack } from "@minecraft/server";

const INPUT_ITEMS = [
  "minecraft:stone",
  "minecraft:cobblestone",
  "minecraft:gravel",
];
const OUTPUT_ITEMS = [
  "minecraft:cobblestone",
  "minecraft:gravel",
  "minecraft:sand",
];

const ENERGY_CONSUMPTION_PER_PROGRESS = 10;
const ENERGY_CONSUMPTION_PER_TICK =
  ENERGY_CONSUMPTION_PER_PROGRESS / MACHINE_TICK_INTERVAL;

const MAX_PROGRESS = 8;

const progressMap = new Map<string, number>();

export const crusherMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:crusher",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
        inputSlot: {
          type: "itemSlot",
          index: 4,
          slotId: 0,
          allowedItems: INPUT_ITEMS,
        },
        outputSlot: {
          type: "itemSlot",
          index: 5,
          slotId: 1,
          allowedItems: OUTPUT_ITEMS,
        },
        progressIndicator: {
          type: "progressIndicator",
          indicator: "arrow",
          index: 6,
        },
      },
    },
  },
  handlers: {
    updateUi(location) {
      const uid = blockLocationToUid(location);

      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: progressMap.has(uid) ? -ENERGY_CONSUMPTION_PER_TICK : 0,
          },
        ],
        progressIndicators: {
          progressIndicator: (progressMap.get(uid) ?? 0) * 2,
        },
      };
    },
  },
};

//TODO: update working state
//TODO: add hopper interactions

export const crusherComponent: BlockCustomComponent = {
  onTick(e) {
    const uid = blockLocationToUid(e.block);

    const inputItem = getItemInMachineSlot(e.block, 0);
    if (!inputItem) {
      progressMap.delete(uid);
      return;
    }

    const outputItem = getItemInMachineSlot(e.block, 1);
    if (
      outputItem &&
      (outputItem.type !== inputItem.type ||
        outputItem.count >=
          new ItemStack(OUTPUT_ITEMS[outputItem.type]).maxAmount)
    ) {
      progressMap.delete(uid);
      return;
    }

    const progress = progressMap.get(uid) ?? 0;
    const storedEnergy = getMachineStorage(e.block, "energy");

    if (
      storedEnergy <
      ENERGY_CONSUMPTION_PER_PROGRESS * (MAX_PROGRESS - progress)
    ) {
      progressMap.delete(uid);
      return;
    }

    if (progress >= MAX_PROGRESS) {
      setItemInMachineSlot(e.block, 1, {
        type: inputItem.type,
        count: (outputItem?.type ?? 0) + 1,
      });

      progressMap.delete(uid);
      return;
    }

    progressMap.set(uid, progress + 1);
    setMachineStorage(
      e.block,
      "energy",
      storedEnergy - ENERGY_CONSUMPTION_PER_PROGRESS,
    );
  },
};
