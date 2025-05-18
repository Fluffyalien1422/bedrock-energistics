import {
  getMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  MachineItemStack,
  setMachineSlotItem,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { blockLocationToUid } from "../utils/location";
import {
  BlockComponentTickEvent,
  BlockCustomComponent,
  ItemStack,
} from "@minecraft/server";
import {
  BlockStateAccessor,
  depositItemToHopper,
  getHopperBelow,
} from "../utils/block";
import { weightedRandom } from "../utils/math";

const ENERGY_CONSUMPTION_PER_PROGRESS = 4;

const MAX_PROGRESS = 24;

const progressMap = new Map<string, number>();

const OUTPUT_ITEM_TYPES = [
  "minecraft:diamond",
  "minecraft:emerald",
  "minecraft:amethyst_shard",
  "minecraft:raw_iron",
  "minecraft:raw_gold",
  "minecraft:coal",
];

const LOOT_WEIGHTS: Record<string, number> = {
  "minecraft:diamond": 1,
  "minecraft:emerald": 1,
  "minecraft:amethyst_shard": 2,
  "minecraft:raw_iron": 4,
  "minecraft:raw_gold": 4,
  "minecraft:coal": 6,
};

export const voidMinerMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:void_miner",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "energy",
          },
        },
        progressIndicator: {
          type: "progressIndicator",
          indicator: "arrow",
          index: 4,
        },
        outputSlot: {
          type: "itemSlot",
          slotId: 0,
          index: 5,
          allowedItems: OUTPUT_ITEM_TYPES,
        },
      },
    },
  },
  handlers: {
    updateUi({ blockLocation: location }) {
      const uid = blockLocationToUid(location);

      return {
        progressIndicators: {
          progressIndicator: Math.floor((progressMap.get(uid) ?? 0) / 1.5),
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

  const outputItem = await getMachineSlotItem(e.block, 0);

  if (outputItem) {
    if (!getHopperBelow(e.block)) {
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }

    const itemStack = new ItemStack(outputItem.typeId);
    if (!depositItemToHopper(e.block, itemStack)) {
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }

    outputItem.amount--;

    if (outputItem.amount > 0) {
      setMachineSlotItem(e.block, 0, outputItem);
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }

    setMachineSlotItem(e.block, 0);
  }

  const progress = progressMap.get(uid) ?? 0;
  const storedEnergy = getMachineStorage(e.block, "energy");

  if (
    storedEnergy <
    ENERGY_CONSUMPTION_PER_PROGRESS * (MAX_PROGRESS - progress)
  ) {
    progressMap.delete(uid);
    workingState.set(false);
    return;
  }

  if (progress >= MAX_PROGRESS) {
    const resultItemType = weightedRandom(LOOT_WEIGHTS);
    setMachineSlotItem(e.block, 0, new MachineItemStack(resultItemType));

    progressMap.delete(uid);
    return;
  }

  progressMap.set(uid, progress + 1);
  void setMachineStorage(
    e.block,
    "energy",
    storedEnergy - ENERGY_CONSUMPTION_PER_PROGRESS,
  );

  workingState.set(true);
}

export const voidMinerComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
