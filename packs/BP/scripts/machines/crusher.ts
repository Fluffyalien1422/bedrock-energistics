import {
  getMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  setMachineSlotItem,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { blockLocationToUid } from "../utils/location";
import { MACHINE_TICK_INTERVAL } from "../constants";
import { BlockCustomComponent, ItemStack } from "@minecraft/server";
import {
  BlockStateAccessor,
  depositItemToHopper,
  getFirstSlotWithItemInConnectedHoppers,
  getHopperBelow,
} from "../utils/block";
import { decrementSlot } from "../utils/item";

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

const MAX_PROGRESS = 16;

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
    updateUi({ blockLocation: location }) {
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
          progressIndicator: progressMap.get(uid) ?? 0,
        },
      };
    },
  },
};

export const crusherComponent: BlockCustomComponent = {
  onTick(e) {
    const uid = blockLocationToUid(e.block);

    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    let outputItem = getMachineSlotItem(e.block, 1);

    if (outputItem && getHopperBelow(e.block)) {
      const itemStack = new ItemStack(OUTPUT_ITEMS[outputItem.typeIndex]);
      if (depositItemToHopper(e.block, itemStack)) {
        outputItem.count--;
        if (outputItem.count > 0) {
          setMachineSlotItem(e.block, 1, outputItem);
        } else {
          setMachineSlotItem(e.block, 1);
          outputItem = undefined;
        }
      }
    }

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
      } else {
        progressMap.delete(uid);
        workingState.set(false);
        return;
      }
    }

    if (
      outputItem &&
      (outputItem.typeIndex !== inputItem.typeIndex ||
        outputItem.count >=
          new ItemStack(OUTPUT_ITEMS[outputItem.typeIndex]).maxAmount)
    ) {
      progressMap.delete(uid);
      workingState.set(false);
      return;
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
      inputItem.count--;
      setMachineSlotItem(
        e.block,
        0,
        inputItem.count > 0 ? inputItem : undefined,
      );

      setMachineSlotItem(e.block, 1, {
        typeIndex: inputItem.typeIndex,
        count: (outputItem?.count ?? 0) + 1,
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

    workingState.set(true);
  },
};
