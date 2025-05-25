import {
  BlockComponentTickEvent,
  BlockCustomComponent,
  BlockTypes,
  ItemStack,
} from "@minecraft/server";
import {
  getMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  MachineItemStack,
  setMachineSlotItem,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import {
  BlockStateAccessor,
  getFirstSlotWithItemInConnectedHoppers,
} from "../utils/block";
import { getBlockInDirection, StrDirection } from "../utils/direction";
import { decrementMachineSlot, decrementSlot } from "../utils/item";

const ENERGY_CONSUMPTION_PER_BLOCK = 5;

export const blockPlacerMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:block_placer",
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
        },
      },
    },
  },
};

async function onTickAsync(e: BlockComponentTickEvent): Promise<void> {
  const workingState = new BlockStateAccessor<boolean>(
    e.block,
    "fluffyalien_energistics:working",
  );

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
      workingState.set(false);
      return;
    }
  }

  const blockTypeToPlace = BlockTypes.get(inputItem.typeId);

  if (!blockTypeToPlace) {
    workingState.set(false);
    return;
  }

  const storedEnergy = getMachineStorage(e.block, "energy");

  if (storedEnergy < ENERGY_CONSUMPTION_PER_BLOCK) {
    workingState.set(false);
    return;
  }

  workingState.set(true);

  const facingDirection = e.block.permutation.getState(
    "minecraft:facing_direction",
  ) as StrDirection;

  const targetBlock = getBlockInDirection(e.block, facingDirection);
  if (!targetBlock?.isAir) {
    return;
  }

  decrementMachineSlot(e.block, "inputSlot", inputItem);
  void setMachineStorage(
    e.block,
    "energy",
    storedEnergy - ENERGY_CONSUMPTION_PER_BLOCK,
  );

  targetBlock.setType(blockTypeToPlace);
}

export const blockPlacerComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
