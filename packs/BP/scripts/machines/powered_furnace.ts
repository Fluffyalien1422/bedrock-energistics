import {
  getMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  setMachineSlotItem,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { blockLocationToUid } from "../utils/location";
import { MACHINE_TICK_INTERVAL } from "../constants";
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
const ENERGY_CONSUMPTION_PER_TICK =
  ENERGY_CONSUMPTION_PER_PROGRESS / MACHINE_TICK_INTERVAL;

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
        },
        progressIndicator: {
          type: "progressIndicator",
          indicator: "arrow",
          index: 6,
        },
        inputSlot: {
          type: "itemSlot",
          slotId: 0,
          index: 4,
        },
        outputSlot: {
          type: "itemSlot",
          slotId: 1,
          index: 5,
        },
      },
    },
  },
  handlers: {
    updateUi({ blockLocation: location }) {
      const uid = blockLocationToUid(location);

      return {
        storageBars: {
          energyBar: {
            type: "energy",
            change: progressMap.has(uid) ? -ENERGY_CONSUMPTION_PER_TICK : 0,
          },
        },
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

  const outputItem = await getMachineSlotItem(e.block, 1);

  if (outputItem && getHopperBelow(e.block)) {
    const itemStack = new ItemStack(outputItem.typeId, outputItem.count);
    if (depositItemToHopper(e.block, itemStack)) {
      decrementMachineSlot(e.block, 1, outputItem);
    }
  }

  let inputItem = await getMachineSlotItem(e.block, 0);

  if (inputItem) {
    const itemStack = new ItemStack(inputItem.typeId, inputItem.count);
    if (itemStack.amount < itemStack.maxAmount) {
      const hopperSlot = getFirstSlotWithItemInConnectedHoppers(e.block, [
        itemStack.typeId,
      ]);

      if (hopperSlot) {
        inputItem.count++;
        setMachineSlotItem(e.block, 0, inputItem);
        decrementSlot(hopperSlot);
      }
    }
  } else {
    const hopperSlot = getFirstSlotWithItemInConnectedHoppers(e.block);

    if (hopperSlot) {
      inputItem = {
        typeId: hopperSlot.typeId,
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

  if (!(inputItem.typeId in POWERED_FURNACE_RECIPES)) {
    progressMap.delete(uid);
    workingState.set(false);
    return;
  }

  const result = POWERED_FURNACE_RECIPES[inputItem.typeId];
  const resultItemStack = new ItemStack(result.item, result.count);

  if (outputItem) {
    const outputItemStack = new ItemStack(outputItem.typeId, outputItem.count);

    if (
      !outputItemStack.isStackableWith(resultItemStack) ||
      outputItem.count + result.count >= outputItemStack.maxAmount
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
    decrementMachineSlot(e.block, 0, inputItem);

    if (outputItem) {
      outputItem.count += result.count;
      setMachineSlotItem(e.block, 1, outputItem);
    } else {
      setMachineSlotItem(e.block, 1, {
        typeId: result.item,
        count: result.count,
      });
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
