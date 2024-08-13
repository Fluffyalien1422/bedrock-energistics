import {
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
} from "@/becore_api";
import {
  blockLocationToUid,
  getEntityAtBlockLocation,
} from "../utils/location";
import { MACHINE_TICK_INTERVAL } from "../constants";
import { BlockCustomComponent, ItemStack } from "@minecraft/server";
import {
  BlockStateAccessor,
  depositItemToHopper,
  getFirstSlotWithItemInConnectedHoppers,
  getHopperBelow,
} from "../utils/block";
import { decrementSlot } from "../utils/item";
import { POWERED_FURNACE_RECIPES } from "../generated/powered_furnace_recipes";

const ENERGY_CONSUMPTION_PER_PROGRESS = 10;
const ENERGY_CONSUMPTION_PER_TICK =
  ENERGY_CONSUMPTION_PER_PROGRESS / MACHINE_TICK_INTERVAL;

const MAX_PROGRESS = 8;

const progressMap = new Map<string, number>();

export const poweredFurnaceMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:powered_furnace",
    persistentEntity: true,
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
      },
    },
  },
  handlers: {
    updateUi(location) {
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
          progressIndicator: (progressMap.get(uid) ?? 0) * 2,
        },
      };
    },
  },
};

export const poweredFurnaceComponent: BlockCustomComponent = {
  onTick(e) {
    const entity = getEntityAtBlockLocation(
      e.block,
      "fluffyalien_energistics:powered_furnace",
    );
    if (!entity) return;

    const uid = blockLocationToUid(e.block);

    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    const container = entity.getComponent("inventory")!.container!;

    const outputSlot = container.getSlot(5);

    if (outputSlot.hasItem() && getHopperBelow(e.block)) {
      const itemStack = outputSlot.getItem()!;
      if (depositItemToHopper(e.block, itemStack)) {
        decrementSlot(outputSlot);
      }
    }

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
        progressMap.delete(uid);
        workingState.set(false);
        return;
      }
    }

    if (!(inputSlot.typeId in POWERED_FURNACE_RECIPES)) {
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }

    const result = POWERED_FURNACE_RECIPES[inputSlot.typeId];
    const resultItemStack = new ItemStack(result.item, result.count);

    if (
      outputSlot.hasItem() &&
      (!outputSlot.isStackableWith(resultItemStack) ||
        outputSlot.amount + result.count >= outputSlot.maxAmount)
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
      decrementSlot(inputSlot);

      if (outputSlot.hasItem()) {
        outputSlot.amount += result.count;
      } else {
        outputSlot.setItem(resultItemStack);
      }

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
