import {
  generate,
  getMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  MachineItemStack,
  setMachineSlotItem,
} from "bedrock-energistics-core-api";
import {
  BlockComponentTickEvent,
  BlockCustomComponent,
  ItemStack,
} from "@minecraft/server";
import {
  BlockStateAccessor,
  getFirstSlotWithItemInConnectedHoppers,
} from "../utils/block";
import { decrementSlot } from "../utils/item";
import { MACHINE_TICK_INTERVAL, MAX_MACHINE_STORAGE } from "../constants";
import { blockLocationToUid } from "../utils/location";

const INPUT_ITEMS = [
  "minecraft:beetroot_seeds",
  "minecraft:melon_seeds",
  "minecraft:pumpkin_seeds",
  "minecraft:torchflower_seeds",
  "minecraft:wheat_seeds",
  "minecraft:oak_sapling",
  "minecraft:acacia_sapling",
  "minecraft:birch_sapling",
  "minecraft:cherry_sapling",
  "minecraft:dark_oak_sapling",
  "minecraft:jungle_sapling",
  "minecraft:spruce_sapling",
];

const MAX_PROGRESS: Record<string, number> = {
  "minecraft:beetroot_seeds": 26,
  "minecraft:melon_seeds": 26,
  "minecraft:pumpkin_seeds": 26,
  "minecraft:torchflower_seeds": 26,
  "minecraft:wheat_seeds": 26,
  "minecraft:oak_sapling": 38,
  "minecraft:acacia_sapling": 38,
  "minecraft:birch_sapling": 38,
  "minecraft:cherry_sapling": 38,
  "minecraft:dark_oak_sapling": 38,
  "minecraft:jungle_sapling": 38,
  "minecraft:spruce_sapling": 38,
};

const ENERGY_GENERATION_PER_PROGRESS = 10;
const ENERGY_GENERATION_PER_TICK =
  ENERGY_GENERATION_PER_PROGRESS / MACHINE_TICK_INTERVAL;

const progressMap = new Map<string, [number, number]>();

export const organicGeneratorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:organic_generator",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
        fuelSlot: {
          type: "itemSlot",
          index: 4,
          slotId: 0,
          allowedItems: INPUT_ITEMS,
        },
        flameIndicator: {
          type: "progressIndicator",
          index: 5,
          indicator: "flame",
        },
      },
    },
  },
  handlers: {
    updateUi({ blockLocation }) {
      const uid = blockLocationToUid(blockLocation);
      const progress = progressMap.get(uid) ?? 0;

      return {
        storageBars: {
          energyBar: {
            type: "energy",
            change: progress ? ENERGY_GENERATION_PER_TICK : 0,
          },
        },
        progressIndicators: {
          flameIndicator: progress
            ? Math.floor((progress[0] / progress[1]) * 13)
            : 0,
        },
      };
    },
  },
};

async function onTickAsync(e: BlockComponentTickEvent): Promise<void> {
  const uid = blockLocationToUid(e.block);

  let inputItem = await getMachineSlotItem(e.block, 0);

  if (inputItem) {
    const inputItemTypeId = inputItem.typeId;
    if (inputItem.amount < new ItemStack(inputItemTypeId).maxAmount) {
      const hopperSlot = getFirstSlotWithItemInConnectedHoppers(e.block, [
        inputItemTypeId,
      ]);

      if (hopperSlot) {
        inputItem.amount++;
        setMachineSlotItem(e.block, 0, inputItem);
        decrementSlot(hopperSlot);
      }
    }
  } else {
    const hopperSlot = getFirstSlotWithItemInConnectedHoppers(
      e.block,
      INPUT_ITEMS,
    );

    if (hopperSlot) {
      inputItem = new MachineItemStack(hopperSlot.typeId);
      setMachineSlotItem(e.block, 0, inputItem);
      decrementSlot(hopperSlot);
    }
  }

  const workingState = new BlockStateAccessor(
    e.block,
    "fluffyalien_energistics:working",
  );

  const progress = progressMap.get(uid) ?? [0, 0];

  if (progress[0] > 0) {
    generate(e.block, "energy", ENERGY_GENERATION_PER_PROGRESS);
    progressMap.set(uid, [progress[0] - 1, progress[1]]);
    workingState.set(true);
    return;
  }

  const storedEnergy = getMachineStorage(e.block, "energy");

  if (
    !inputItem ||
    storedEnergy +
      ENERGY_GENERATION_PER_PROGRESS * MAX_PROGRESS[inputItem.typeId] >
      MAX_MACHINE_STORAGE
  ) {
    progressMap.delete(uid);
    workingState.set(false);
    generate(e.block, "energy", 0);
    return;
  }

  const maxProgress = MAX_PROGRESS[inputItem.typeId];
  progressMap.set(uid, [maxProgress, maxProgress]);

  inputItem.amount--;
  setMachineSlotItem(e.block, 0, inputItem.amount > 0 ? inputItem : undefined);
}

export const organicGeneratorComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
