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
const RECIPES: Record<string, string> = {
  "minecraft:stone": "minecraft:cobblestone",
  "minecraft:cobblestone": "minecraft:gravel",
  "minecraft:gravel": "minecraft:sand",
};

const ENERGY_CONSUMPTION_PER_PROGRESS = 10;

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
          defaults: {
            type: "energy",
          },
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
        progressIndicators: {
          progressIndicator: progressMap.get(uid) ?? 0,
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

  let outputItem = await getMachineSlotItem(e.block, 1);

  if (outputItem && getHopperBelow(e.block)) {
    const itemStack = new ItemStack(outputItem.typeId);
    if (depositItemToHopper(e.block, itemStack)) {
      outputItem.amount--;
      if (outputItem.amount > 0) {
        setMachineSlotItem(e.block, 1, outputItem);
      } else {
        setMachineSlotItem(e.block, 1);
        outputItem = undefined;
      }
    }
  }

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
    } else {
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }
  }

  const result = RECIPES[inputItem.typeId];

  if (
    outputItem &&
    (outputItem.typeId !== result ||
      outputItem.amount >= new ItemStack(outputItem.typeId).maxAmount)
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
    inputItem.amount--;
    setMachineSlotItem(
      e.block,
      0,
      inputItem.amount > 0 ? inputItem : undefined,
    );

    setMachineSlotItem(
      e.block,
      1,
      new MachineItemStack(result, (outputItem?.amount ?? 0) + 1),
    );

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

export const crusherComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
