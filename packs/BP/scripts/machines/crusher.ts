import { MachineDefinition } from "@/becore_api";
import { blockLocationToUid } from "../utils/location";
import { MACHINE_TICK_INTERVAL } from "../constants";

const RECIPES: Record<string, string> = {
  "minecraft:stone": "minecraft:cobblestone",
  "minecraft:cobblestone": "minecraft:gravel",
  "minecraft:gravel": "minecraft:sand",
};

const ENERGY_CONSUMPTION_PER_PROGRESS = 10;
const ENERGY_CONSUMPTION_PER_TICK =
  ENERGY_CONSUMPTION_PER_PROGRESS / MACHINE_TICK_INTERVAL;

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
          allowedItems: Object.keys(RECIPES),
        },
        outputSlot: {
          type: "itemSlot",
          index: 5,
          slotId: 0,
          allowedItems: Object.values(RECIPES),
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
      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: -ENERGY_CONSUMPTION_PER_TICK,
          },
        ],
        progressIndicators: {
          progressIndicator: progressMap.get(blockLocationToUid(location)) ?? 0,
        },
      };
    },
  },
};
