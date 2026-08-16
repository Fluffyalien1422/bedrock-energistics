import {
  addMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  MachineItemStack,
  setMachineStorage,
  takeMachineSlotItem,
} from "bedrock-energistics-core-api";
import { blockLocationToUid } from "../utils/location";
import {
  BlockComponentTickEvent,
  BlockCustomComponent,
  ItemStack,
} from "@minecraft/server";
import { BlockStateAccessor } from "../utils/block";
import {
  getInputItemWithHopperSupport,
  getOutputItemWithHopperSupport,
} from "../utils/item";
import {
  CRUSHER_ENERGY_PER_PROGRESS as ENERGY_CONSUMPTION_PER_PROGRESS,
  CRUSHER_MAX_PROGRESS as MAX_PROGRESS,
} from "../balance";
import {
  createProgressArrow,
  createTiledIconElements,
  updateProgressArrow,
} from "../utils/ui";

const INPUT_ITEMS = [
  "minecraft:stone",
  "minecraft:cobblestone",
  "minecraft:gravel",
];
const OUTPUT_ITEMS = [
  "minecraft:cobblestone",
  "minecraft:gravel",
  "minecraft:sand",
];
const RECIPES: Record<string, string> = {
  "minecraft:stone": "minecraft:cobblestone",
  "minecraft:cobblestone": "minecraft:gravel",
  "minecraft:gravel": "minecraft:sand",
};

const PROGRESS_ARROW = createProgressArrow("progress", 6);

const progressMap = new Map<string, number>();

export const crusherMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:crusher",
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
          allowedItems: INPUT_ITEMS,
        },
        outputSlot: {
          type: "itemSlot",
          index: 5,
          allowedItems: OUTPUT_ITEMS,
        },
        // slots 6-7
        ...createTiledIconElements(PROGRESS_ARROW),
      },
    },
  },
  handlers: {
    updateUi({ blockLocation: location }) {
      const uid = blockLocationToUid(location);

      return {
        progressIndicators: updateProgressArrow(
          PROGRESS_ARROW,
          progressMap.get(uid) ?? 0,
          MAX_PROGRESS,
        ),
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

  const outputItem = await getOutputItemWithHopperSupport(
    e.block,
    "outputSlot",
  );

  const inputItem = await getInputItemWithHopperSupport(
    e.block,
    "inputSlot",
    INPUT_ITEMS,
  );

  if (!inputItem) {
    progressMap.delete(uid);
    workingState.set(false);
    return;
  }

  const result = RECIPES[inputItem.typeId];

  if (
    outputItem &&
    (outputItem.typeId !== result ||
      outputItem.amount >= new ItemStack(outputItem.typeId).maxAmount)
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
    progressMap.delete(uid);

    // only produce the result if the input was really consumed
    const consumed = await takeMachineSlotItem(e.block, "inputSlot", 1, {
      expectType: inputItem.typeId,
    });
    if (!consumed) return;

    const added = await addMachineSlotItem(
      e.block,
      "outputSlot",
      new MachineItemStack(result),
    );
    if (!added) {
      // the output slot filled up while we waited; give the input back
      await addMachineSlotItem(e.block, "inputSlot", consumed);
    }

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

export const crusherComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
