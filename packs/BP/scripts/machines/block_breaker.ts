import { BlockCustomComponent } from "@minecraft/server";
import {
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { getBlockInDirection, StrDirection } from "../utils/direction";
import { BlockStateAccessor } from "../utils/block";

const ENERGY_CONSUMPTION_PER_BLOCK = 5;

export const blockBreakerMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:block_breaker",
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
        storageBars: {
          energyBar: {
            type: "energy",
            change: 0,
          },
        },
      };
    },
  },
};

export const blockBreakerComponent: BlockCustomComponent = {
  onTick(e) {
    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );
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
    if (!targetBlock || targetBlock.isAir || targetBlock.isLiquid) {
      return;
    }

    setMachineStorage(
      e.block,
      "energy",
      storedEnergy - ENERGY_CONSUMPTION_PER_BLOCK,
    );

    targetBlock.dimension.runCommand(
      `setblock ${targetBlock.x.toString()} ${targetBlock.y.toString()} ${targetBlock.z.toString()} air destroy`,
    );
  },
};
