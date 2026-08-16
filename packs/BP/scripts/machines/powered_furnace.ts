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
import { POWERED_FURNACE_RECIPES } from "../generated/powered_furnace_recipes";
import {
  POWERED_FURNACE_ENERGY_PER_PROGRESS as ENERGY_CONSUMPTION_PER_PROGRESS,
  POWERED_FURNACE_MAX_PROGRESS as MAX_PROGRESS,
} from "../balance";
import {
  createProgressArrow,
  createTiledIconElements,
  updateProgressArrow,
} from "../utils/ui";

const PROGRESS_ARROW = createProgressArrow("progress", 6);

const progressMap = new Map<string, number>();

export const poweredFurnaceMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:powered_furnace",
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
        outputSlot: {
          type: "itemSlot",
          index: 5,
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

  const inputItem = await getInputItemWithHopperSupport(e.block, "inputSlot");

  if (!inputItem) {
    progressMap.delete(uid);
    workingState.set(false);
    return;
  }

  if (!(inputItem.typeId in POWERED_FURNACE_RECIPES)) {
    progressMap.delete(uid);
    workingState.set(false);
    return;
  }

  const result = POWERED_FURNACE_RECIPES[inputItem.typeId];
  const resultItemStack = new ItemStack(result.item, result.count);

  if (outputItem) {
    const outputItemStack = new ItemStack(outputItem.typeId, outputItem.amount);

    if (
      !outputItemStack.isStackableWith(resultItemStack) ||
      outputItem.amount + result.count >= outputItemStack.maxAmount
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
    progressMap.delete(uid);

    // only produce the result if the input was really consumed
    const consumed = await takeMachineSlotItem(e.block, "inputSlot", 1, {
      expectType: inputItem.typeId,
    });
    if (!consumed) return;

    const added = await addMachineSlotItem(
      e.block,
      "outputSlot",
      new MachineItemStack(result.item, result.count),
      {
        // all or nothing: a partial add would drop the rest of the result
        expectMaxAmount: resultItemStack.maxAmount - result.count,
      },
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

export const poweredFurnaceComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
