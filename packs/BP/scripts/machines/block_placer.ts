import {
  BlockComponentTickEvent,
  BlockCustomComponent,
  BlockTypes,
} from "@minecraft/server";
import {
  addMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
  takeMachineSlotItem,
} from "bedrock-energistics-core-api";
import { BlockStateAccessor } from "../utils/block";
import { getBlockInDirection, StrDirection } from "../utils/direction";
import { getInputItemWithHopperSupport } from "../utils/item";

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

  const inputItem = await getInputItemWithHopperSupport(e.block, "inputSlot");

  if (!inputItem) {
    workingState.set(false);
    return;
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

  if (!getBlockInDirection(e.block, facingDirection)?.isAir) {
    return;
  }

  // only place the block if the item was really consumed
  const consumed = await takeMachineSlotItem(e.block, "inputSlot", 1, {
    expectType: inputItem.typeId,
  });
  if (!consumed) return;

  // re-read the target: the await gave the world time to change
  const targetBlock = getBlockInDirection(e.block, facingDirection);
  if (!targetBlock?.isAir) {
    // the target was filled while we waited; give the item back
    await addMachineSlotItem(e.block, "inputSlot", consumed);
    return;
  }

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
