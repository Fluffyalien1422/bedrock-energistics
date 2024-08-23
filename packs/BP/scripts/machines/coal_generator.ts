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

const INPUT_ITEMS = ["minecraft:coal"];

const MAX_PROGRESS = 26;

const ENERGY_GENERATION_PER_PROGRESS = 14;
const ENERGY_GENERATION_PER_TICK =
  ENERGY_GENERATION_PER_PROGRESS / MACHINE_TICK_INTERVAL;
const ENERGY_GENERATION_PER_FUEL =
  ENERGY_GENERATION_PER_PROGRESS * MAX_PROGRESS;

const progressMap = new Map<string, number>();

export const coalGeneratorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:coal_generator",
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

      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: progress ? ENERGY_GENERATION_PER_TICK : 0,
          },
        ],
        progressIndicators: {
          flameIndicator: Math.floor(progress / 2),
        },
      };
    },
  },
};

export const coalGeneratorComponent: BlockCustomComponent = {
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
      storedEnergy + ENERGY_GENERATION_PER_FUEL >= MAX_MACHINE_STORAGE
    ) {
      progressMap.delete(uid);
      workingState.set(false);
      generate(e.block, "energy", 0);
      return;
    }

    progressMap.set(uid, MAX_PROGRESS);

    inputItem.count--;
    setMachineSlotItem(e.block, 0, inputItem.count > 0 ? inputItem : undefined);
  },
};
