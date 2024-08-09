import {
  getItemInMachineSlot,
  getMachineStorage,
  MachineDefinition,
  setItemInMachineSlot,
  setMachineStorage,
} from "@/becore_api";
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
import {
  POWERED_FURNACE_INPUT_ITEMS,
  POWERED_FURNACE_OUTPUT_ITEM_COUNTS,
  POWERED_FURNACE_OUTPUT_ITEMS,
} from "../generated/powered_furnace_recipes";

const ENERGY_CONSUMPTION_PER_PROGRESS = 10;
const ENERGY_CONSUMPTION_PER_TICK =
  ENERGY_CONSUMPTION_PER_PROGRESS / MACHINE_TICK_INTERVAL;

const MAX_PROGRESS = 8;

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
        inputSlot: {
          type: "itemSlot",
          index: 4,
          slotId: 0,
          allowedItems: POWERED_FURNACE_INPUT_ITEMS,
        },
        outputSlot: {
          type: "itemSlot",
          index: 5,
          slotId: 1,
          allowedItems: POWERED_FURNACE_OUTPUT_ITEMS,
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
    const uid = blockLocationToUid(e.block);

    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    let outputItem = getItemInMachineSlot(e.block, 1);

    if (outputItem && getHopperBelow(e.block)) {
      const itemStack = new ItemStack(
        POWERED_FURNACE_INPUT_ITEMS[outputItem.typeIndex],
      );
      if (depositItemToHopper(e.block, itemStack)) {
        outputItem.count--;
        if (outputItem.count > 0) {
          setItemInMachineSlot(e.block, 1, outputItem);
        } else {
          setItemInMachineSlot(e.block, 1);
          outputItem = undefined;
        }
      }
    }

    let inputItem = getItemInMachineSlot(e.block, 0);

    if (inputItem) {
      const inputItemTypeId = POWERED_FURNACE_INPUT_ITEMS[inputItem.typeIndex];
      if (inputItem.count < new ItemStack(inputItemTypeId).maxAmount) {
        const hopperSlot = getFirstSlotWithItemInConnectedHoppers(e.block, [
          inputItemTypeId,
        ]);

        if (hopperSlot) {
          inputItem.count++;
          setItemInMachineSlot(e.block, 0, inputItem);
          decrementSlot(hopperSlot);
        }
      }
    } else {
      const hopperSlot = getFirstSlotWithItemInConnectedHoppers(
        e.block,
        POWERED_FURNACE_INPUT_ITEMS,
      );

      if (hopperSlot) {
        inputItem = {
          typeIndex: POWERED_FURNACE_INPUT_ITEMS.indexOf(hopperSlot.typeId),
          count: 1,
        };
        setItemInMachineSlot(e.block, 0, inputItem);
        decrementSlot(hopperSlot);
      } else {
        progressMap.delete(uid);
        workingState.set(false);
        return;
      }
    }

    const resultCount = POWERED_FURNACE_OUTPUT_ITEM_COUNTS[inputItem.typeIndex];

    if (
      outputItem &&
      (outputItem.typeIndex !== inputItem.typeIndex ||
        outputItem.count + resultCount >=
          new ItemStack(POWERED_FURNACE_OUTPUT_ITEMS[outputItem.typeIndex])
            .maxAmount)
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
      setItemInMachineSlot(
        e.block,
        0,
        inputItem.count > 0 ? inputItem : undefined,
      );

      setItemInMachineSlot(e.block, 1, {
        typeIndex: inputItem.typeIndex,
        count: (outputItem?.count ?? 0) + resultCount,
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
