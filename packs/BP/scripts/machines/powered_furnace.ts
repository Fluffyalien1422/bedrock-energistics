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
import { decrementMachineSlot, decrementSlot } from "../utils/item";
import { POWERED_FURNACE_RECIPES } from "../generated/powered_furnace_recipes";

const ENERGY_CONSUMPTION_PER_PROGRESS = 5;

const MAX_PROGRESS = 16;

const progressMap = new Map<string, number>();

export const poweredFurnaceMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:powered_furnace",
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
          index: 6,
        },
        inputSlot: {
          type: "itemSlot",
          index: 4,
        },
        outputSlot: {
          type: "itemSlot",
          index: 5,
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

  const outputItem = await getMachineSlotItem(e.block, "outputSlot");

  if (outputItem && getHopperBelow(e.block)) {
    const itemStack = new ItemStack(outputItem.typeId, outputItem.amount);
    if (depositItemToHopper(e.block, itemStack)) {
      decrementMachineSlot(e.block, "outputSlot", outputItem);
    }
  }

  let inputItem = await getMachineSlotItem(e.block, "inputSlot");

  if (inputItem) {
    const itemStack = new ItemStack(inputItem.typeId, inputItem.amount);
    if (itemStack.amount < itemStack.maxAmount) {
      const hopperSlot = getFirstSlotWithItemInConnectedHoppers(e.block, [
        itemStack.typeId,
      ]);

      if (hopperSlot) {
        inputItem.amount++;
        setMachineSlotItem(e.block, "inputSlot", inputItem);
        decrementSlot(hopperSlot);
      }
    }
  } else {
    const hopperSlot = getFirstSlotWithItemInConnectedHoppers(e.block);

    if (hopperSlot) {
      inputItem = new MachineItemStack(hopperSlot.typeId);
      setMachineSlotItem(e.block, "inputSlot", inputItem);
      decrementSlot(hopperSlot);
    } else {
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }
  }

  if (!(inputItem.typeId in POWERED_FURNACE_RECIPES)) {
    progressMap.delete(uid);
    workingState.set(false);
    return;
  }

  const result = POWERED_FURNACE_RECIPES[inputItem.typeId];
  const resultItemStack = new ItemStack(result.item, result.count);

  if (outputItem) {
    const outputItemStack = new ItemStack(outputItem.typeId, outputItem.amount);

    if (
      !outputItemStack.isStackableWith(resultItemStack) ||
      outputItem.amount + result.count >= outputItemStack.maxAmount
    ) {
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }
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
    decrementMachineSlot(e.block, "inputSlot", inputItem);

    if (outputItem) {
      outputItem.amount += result.count;
      setMachineSlotItem(e.block, "outputSlot", outputItem);
    } else {
      setMachineSlotItem(
        e.block,
        "outputSlot",
        new MachineItemStack(result.item, result.count),
      );
    }

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

export const poweredFurnaceComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
