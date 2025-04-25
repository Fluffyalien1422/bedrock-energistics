import {
  generate,
  getMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  MachineItemStack,
  setMachineSlotItem,
} from "bedrock-energistics-core-api";
import {
  BlockComponentTickEvent,
  BlockCustomComponent,
  ItemStack,
} from "@minecraft/server";
import {
  BlockStateAccessor,
  getFirstSlotWithItemInConnectedHoppers,
} from "../utils/block";
import { decrementSlot } from "../utils/item";
import { MAX_MACHINE_STORAGE } from "../constants";
import { blockLocationToUid } from "../utils/location";

const INPUT_ITEMS = ["minecraft:coal"];

const MAX_PROGRESS = 52;

const ENERGY_GENERATION_PER_PROGRESS = 14;
const ENERGY_GENERATION_PER_FUEL =
  ENERGY_GENERATION_PER_PROGRESS * MAX_PROGRESS;

const progressMap = new Map<string, number>();

export const coalGeneratorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:coal_generator",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: { type: "energy" },
        },
        fuelSlot: {
          type: "itemSlot",
          index: 4,
          slotId: 0,
          allowedItems: INPUT_ITEMS,
        },
        flameIndicator: {
          type: "progressIndicator",
          index: 5,
          indicator: "flame",
        },
      },
    },
  },
  handlers: {
    updateUi({ blockLocation }) {
      const uid = blockLocationToUid(blockLocation);
      const progress = progressMap.get(uid) ?? 0;

      return {
        progressIndicators: {
          flameIndicator: Math.floor(progress / 4),
        },
      };
    },
  },
};

async function onTickAsync(e: BlockComponentTickEvent): Promise<void> {
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
    }
  }

  const uid = blockLocationToUid(e.block);

  const workingState = new BlockStateAccessor(
    e.block,
    "fluffyalien_energistics:working",
  );

  const progress = progressMap.get(uid) ?? 0;

  if (progress > 0) {
    generate(e.block, "energy", ENERGY_GENERATION_PER_PROGRESS);
    progressMap.set(uid, progress - 1);
    workingState.set(true);
    return;
  }

  const storedEnergy = getMachineStorage(e.block, "energy");

  if (
    !inputItem ||
    storedEnergy + ENERGY_GENERATION_PER_FUEL > MAX_MACHINE_STORAGE
  ) {
    progressMap.delete(uid);
    workingState.set(false);
    generate(e.block, "energy", 0);
    return;
  }

  progressMap.set(uid, MAX_PROGRESS);

  inputItem.amount--;
  setMachineSlotItem(e.block, 0, inputItem.amount > 0 ? inputItem : undefined);
}

export const coalGeneratorComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
