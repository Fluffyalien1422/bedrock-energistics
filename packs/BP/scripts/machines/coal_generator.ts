import {
  generate,
  getMachineStorage,
  MachineDefinition,
  takeMachineSlotItem,
} from "bedrock-energistics-core-api";
import {
  BlockComponentTickEvent,
  BlockCustomComponent,
} from "@minecraft/server";
import { BlockStateAccessor } from "../utils/block";
import { getInputItemWithHopperSupport } from "../utils/item";
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
  const inputItem = await getInputItemWithHopperSupport(
    e.block,
    "fuelSlot",
    INPUT_ITEMS,
  );

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

  // only start burning if the fuel was really consumed
  const consumed = await takeMachineSlotItem(e.block, "fuelSlot", 1, {
    expectType: inputItem.typeId,
  });

  if (!consumed) {
    progressMap.delete(uid);
    workingState.set(false);
    generate(e.block, "energy", 0);
    return;
  }

  progressMap.set(uid, MAX_PROGRESS);
}

export const coalGeneratorComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
