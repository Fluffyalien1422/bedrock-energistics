import { BlockCustomComponent, BlockTypes } from "@minecraft/server";
import {
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { getEntityAtBlockLocation } from "../utils/location";
import {
  BlockStateAccessor,
  getFirstSlotWithItemInConnectedHoppers,
} from "../utils/block";
import { getBlockInDirection, StrDirection } from "../utils/direction";
import { decrementSlot } from "../utils/item";

const ENERGY_CONSUMPTION_PER_BLOCK = 5;

export const blockPlacerMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:block_placer",
    persistentEntity: true,
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
      },
    },
  },
  handlers: {
    updateUi() {
      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: 0,
          },
        ],
      };
    },
  },
};

export const blockPlacerComponent: BlockCustomComponent = {
  onTick(e) {
    const entity = getEntityAtBlockLocation(
      e.block,
      "fluffyalien_energistics:block_placer",
    );
    if (!entity) return;

    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    const container = entity.getComponent("inventory")!.container!;
    const inputSlot = container.getSlot(4);

    if (inputSlot.hasItem()) {
      const itemStack = inputSlot.getItem()!;
      if (itemStack.amount < itemStack.maxAmount) {
        const hopperSlot = getFirstSlotWithItemInConnectedHoppers(e.block, [
          itemStack.typeId,
        ]);

        if (hopperSlot) {
          inputSlot.amount++;
          decrementSlot(hopperSlot);
        }
      }
    } else {
      const hopperSlot = getFirstSlotWithItemInConnectedHoppers(e.block);

      if (hopperSlot) {
        const itemStack = hopperSlot.getItem()!;
        itemStack.amount = 1;
        inputSlot.setItem(itemStack);
        decrementSlot(hopperSlot);
      } else {
        workingState.set(false);
        return;
      }
    }

    const blockTypeToPlace = BlockTypes.get(inputSlot.typeId);

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

    setMachineStorage(
      e.block,
      "energy",
      storedEnergy - ENERGY_CONSUMPTION_PER_BLOCK,
    );

    targetBlock.setType(blockTypeToPlace);
  },
};
