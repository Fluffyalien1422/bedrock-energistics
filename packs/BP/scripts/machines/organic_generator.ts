import {
  generate,
  getMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  MAX_MACHINE_STORAGE,
  setMachineSlotItem,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent, ItemStack } from "@minecraft/server";
import {
  BlockStateAccessor,
  getFirstSlotWithItemInConnectedHoppers,
} from "../utils/block";
import { decrementSlot } from "../utils/item";
import { MACHINE_TICK_INTERVAL } from "../constants";
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

const MAX_PROGRESS = [13, 13, 13, 13, 13, 19, 19, 19, 19, 19, 19, 19];

const ENERGY_GENERATION_PER_PROGRESS = 10;
const ENERGY_GENERATION_PER_TICK =
  ENERGY_GENERATION_PER_PROGRESS / MACHINE_TICK_INTERVAL;

const progressMap = new Map<string, number>();

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
    updateUi(blockLocation) {
      const uid = blockLocationToUid(blockLocation);
      const progress = progressMap.get(uid) ?? 0;
      const inputItem = getMachineSlotItem(blockLocation, 0);

      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: progress ? ENERGY_GENERATION_PER_TICK : 0,
          },
        ],
        progressIndicators: {
          flameIndicator: inputItem
            ? Math.floor((progress / MAX_PROGRESS[inputItem.typeIndex]) * 13)
            : 0,
        },
      };
    },
  },
};

export const organicGeneratorComponent: BlockCustomComponent = {
  onTick(e) {
    const uid = blockLocationToUid(e.block);
    const workingState = new BlockStateAccessor(
      e.block,
      "fluffyalien_energistics:working",
    );

    let inputItem = getMachineSlotItem(e.block, 0);

    if (inputItem) {
      const inputItemTypeId = INPUT_ITEMS[inputItem.typeIndex];
      if (inputItem.count < new ItemStack(inputItemTypeId).maxAmount) {
        const hopperSlot = getFirstSlotWithItemInConnectedHoppers(e.block, [
          inputItemTypeId,
        ]);

        if (hopperSlot) {
          inputItem.count++;
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
        inputItem = {
          typeIndex: INPUT_ITEMS.indexOf(hopperSlot.typeId),
          count: 1,
        };
        setMachineSlotItem(e.block, 0, inputItem);
        decrementSlot(hopperSlot);
      }
    }

    const progress = progressMap.get(uid) ?? 0;

    if (progress > 0) {
      generate(e.block, "energy", ENERGY_GENERATION_PER_PROGRESS);
      progressMap.set(uid, progress - 1);
      workingState.set(true);
      return;
    }

    const storedEnergy = getMachineStorage(e.block, "energy");

    if (
      !inputItem ||
      storedEnergy +
        ENERGY_GENERATION_PER_PROGRESS * MAX_PROGRESS[inputItem.typeIndex] >=
        MAX_MACHINE_STORAGE
    ) {
      progressMap.delete(uid);
      workingState.set(false);
      generate(e.block, "energy", 0);
      return;
    }

    progressMap.set(uid, MAX_PROGRESS[inputItem.typeIndex]);

    inputItem.count--;
    setMachineSlotItem(e.block, 0, inputItem.count > 0 ? inputItem : undefined);
  },
};
