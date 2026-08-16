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
import {
  MAX_MACHINE_STORAGE,
  ORGANIC_GENERATOR_ENERGY_PER_PROGRESS as ENERGY_GENERATION_PER_PROGRESS,
  ORGANIC_GENERATOR_SAPLING_MAX_PROGRESS as SAPLING_MAX_PROGRESS,
  ORGANIC_GENERATOR_SEED_MAX_PROGRESS as SEED_MAX_PROGRESS,
} from "../balance";
import { blockLocationToUid } from "../utils/location";
import { isMachineWorking } from "../utils/block";
import {
  animateTiledIcon,
  createDoubleArrow,
  createTiledIconElements,
} from "../utils/ui";

const TRANSFER_ARROW = createDoubleArrow("transfer", 5);

const INPUT_ITEMS = [
  "minecraft:beetroot_seeds",
  "minecraft:melon_seeds",
  "minecraft:pumpkin_seeds",
  "minecraft:torchflower_seeds",
  "minecraft:wheat_seeds",
  "minecraft:oak_sapling",
  "minecraft:acacia_sapling",
  "minecraft:birch_sapling",
  "minecraft:cherry_sapling",
  "minecraft:dark_oak_sapling",
  "minecraft:jungle_sapling",
  "minecraft:spruce_sapling",
];

const MAX_PROGRESS: Record<string, number> = {
  "minecraft:beetroot_seeds": SEED_MAX_PROGRESS,
  "minecraft:melon_seeds": SEED_MAX_PROGRESS,
  "minecraft:pumpkin_seeds": SEED_MAX_PROGRESS,
  "minecraft:torchflower_seeds": SEED_MAX_PROGRESS,
  "minecraft:wheat_seeds": SEED_MAX_PROGRESS,
  "minecraft:oak_sapling": SAPLING_MAX_PROGRESS,
  "minecraft:acacia_sapling": SAPLING_MAX_PROGRESS,
  "minecraft:birch_sapling": SAPLING_MAX_PROGRESS,
  "minecraft:cherry_sapling": SAPLING_MAX_PROGRESS,
  "minecraft:dark_oak_sapling": SAPLING_MAX_PROGRESS,
  "minecraft:jungle_sapling": SAPLING_MAX_PROGRESS,
  "minecraft:spruce_sapling": SAPLING_MAX_PROGRESS,
};

const progressMap = new Map<string, [number, number]>();

export const organicGeneratorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:organic_generator",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "energy",
          },
        },
        fuelSlot: {
          type: "itemSlot",
          index: 4,
          allowedItems: INPUT_ITEMS,
        },
        // slots 5-6
        ...createTiledIconElements(TRANSFER_ARROW),
        // the flame sits below the arrow, where other machines show a working icon
        flameIndicator: {
          type: "progressIndicator",
          index: 7,
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
          ...animateTiledIcon(TRANSFER_ARROW, isMachineWorking(blockLocation)),
          flameIndicator: progress
            ? Math.floor((progress[0] / progress[1]) * 13)
            : 0,
        },
      };
    },
  },
};

async function onTickAsync(e: BlockComponentTickEvent): Promise<void> {
  const uid = blockLocationToUid(e.block);

  const inputItem = await getInputItemWithHopperSupport(
    e.block,
    "fuelSlot",
    INPUT_ITEMS,
  );

  const workingState = new BlockStateAccessor(
    e.block,
    "fluffyalien_energistics:working",
  );

  const progress = progressMap.get(uid) ?? [0, 0];

  if (progress[0] > 0) {
    generate(e.block, "energy", ENERGY_GENERATION_PER_PROGRESS);
    progressMap.set(uid, [progress[0] - 1, progress[1]]);
    workingState.set(true);
    return;
  }

  const storedEnergy = getMachineStorage(e.block, "energy");

  if (
    !inputItem ||
    storedEnergy +
      ENERGY_GENERATION_PER_PROGRESS * MAX_PROGRESS[inputItem.typeId] >
      MAX_MACHINE_STORAGE
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

  const maxProgress = MAX_PROGRESS[consumed.typeId];
  progressMap.set(uid, [maxProgress, maxProgress]);
}

export const organicGeneratorComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
