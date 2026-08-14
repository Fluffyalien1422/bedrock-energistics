import {
  addMachineSlotItem,
  getMachineSlotItem,
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
} from "@minecraft/server";
import {
  BlockStateAccessor,
  depositItemToHopper,
  getHopperBelow,
} from "../utils/block";
import { weightedRandom } from "../utils/math";
import {
  createProgressArrow,
  createSpecialIconElements,
  updateProgressArrow,
} from "../utils/ui";

const ENERGY_CONSUMPTION_PER_PROGRESS = 4;

const MAX_PROGRESS = 24;

const PROGRESS_ARROW = createProgressArrow("progress", 6);

const progressMap = new Map<string, number>();

const OUTPUT_ITEM_TYPES = [
  "minecraft:diamond",
  "minecraft:emerald",
  "minecraft:amethyst_shard",
  "minecraft:raw_iron",
  "minecraft:raw_gold",
  "minecraft:coal",
];

const LOOT_WEIGHTS: Record<string, number> = {
  "minecraft:diamond": 1,
  "minecraft:emerald": 1,
  "minecraft:amethyst_shard": 2,
  "minecraft:raw_iron": 4,
  "minecraft:raw_gold": 4,
  "minecraft:coal": 6,
};

export const voidMinerMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:void_miner",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "energy",
          },
        },
        outputSlot: {
          type: "itemSlot",
          index: 5,
          allowedItems: OUTPUT_ITEM_TYPES,
        },
        // slots 6-7, since the arrow's two tiles have to be next to each other
        ...createSpecialIconElements(PROGRESS_ARROW),
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

  const outputItem = await getMachineSlotItem(e.block, "outputSlot");

  if (outputItem) {
    if (!getHopperBelow(e.block)) {
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }

    // take the item out before handing it to the hopper, so we can't give the
    // hopper a copy of an item the take turns out not to have removed.
    const taken = await takeMachineSlotItem(e.block, "outputSlot", 1, {
      expectType: outputItem.typeId,
    });

    if (!taken) {
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }

    if (!depositItemToHopper(e.block, taken.toItemStack())) {
      await addMachineSlotItem(e.block, "outputSlot", taken);
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }

    if (outputItem.amount > 1) {
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
    const resultItemType = weightedRandom(LOOT_WEIGHTS);
    const added = await addMachineSlotItem(
      e.block,
      "outputSlot",
      new MachineItemStack(resultItemType),
    );

    // if the slot was filled while we mined, hold the progress and retry next
    // tick rather than throwing the result away
    if (added) {
      progressMap.delete(uid);
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

export const voidMinerComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
