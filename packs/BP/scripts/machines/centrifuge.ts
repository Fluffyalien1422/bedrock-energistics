import {
  addMachineSlotItem,
  getMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  MachineItemStack,
  setMachineStorage,
  takeMachineSlotItem,
} from "bedrock-energistics-core-api";
import {
  BlockComponentTickEvent,
  BlockCustomComponent,
} from "@minecraft/server";
import { blockLocationToUid } from "../utils/location";
import {
  BlockStateAccessor,
  depositItemToHopper,
  getHopperBelow,
} from "../utils/block";
import { getInputItemWithHopperSupport } from "../utils/item";
import { weightedRandom } from "../utils/math";
import {
  CENTRIFUGE_ENERGY_PER_PROGRESS as ENERGY_CONSUMPTION_PER_PROGRESS,
  CENTRIFUGE_MAX_PROGRESS as MAX_PROGRESS,
} from "../balance";
import {
  createProgressArrow,
  createTiledIconElements,
  updateProgressArrow,
} from "../utils/ui";

const INPUT_ITEM_TYPES = [
  "minecraft:dirt",
  "minecraft:gravel",
  "minecraft:sand",
  "minecraft:soul_sand",
];

const LOOT: Record<string, Record<string, number>> = {
  "minecraft:dirt": {
    "minecraft:beetroot_seeds": 1,
    "minecraft:melon_seeds": 1,
    "minecraft:pumpkin_seeds": 1,
    "minecraft:torchflower_seeds": 1,
    "minecraft:wheat_seeds": 1,
    "minecraft:oak_sapling": 1,
    "minecraft:acacia_sapling": 1,
    "minecraft:birch_sapling": 1,
    "minecraft:cherry_sapling": 1,
    "minecraft:dark_oak_sapling": 1,
    "minecraft:jungle_sapling": 1,
    "minecraft:spruce_sapling": 1,
  },
  "minecraft:gravel": {
    "minecraft:diamond": 1,
    "minecraft:emerald": 1,
    "minecraft:amethyst_shard": 2,
    "minecraft:iron_nugget": 4,
    "minecraft:gold_nugget": 4,
    "minecraft:coal": 5,
    "minecraft:flint": 6,
  },
  "minecraft:sand": {
    "minecraft:diamond": 1,
    "minecraft:emerald": 1,
    "minecraft:heart_of_the_sea": 1,
    "minecraft:prismarine_shard": 3,
    "minecraft:prismarine_crystals": 3,
    "minecraft:iron_nugget": 5,
    "minecraft:gold_nugget": 5,
    "minecraft:nautilus_shell": 6,
    "minecraft:clay_ball": 6,
    "minecraft:turtle_scute": 6,
  },
  "minecraft:soul_sand": {
    "minecraft:blaze_powder": 1,
    "minecraft:nether_wart": 1,
    "minecraft:ghast_tear": 2,
    "minecraft:quartz": 3,
  },
};

const OUTPUT_SLOT_IDS = [
  "outputSlot0",
  "outputSlot1",
  "outputSlot2",
  "outputSlot3",
];

const PROGRESS_ARROW = createProgressArrow("progress", 9);

const progressMap = new Map<string, number>();

export const centrifugeMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:centrifuge",
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
          allowedItems: INPUT_ITEM_TYPES,
        },
        outputSlot0: {
          type: "itemSlot",
          index: 5,
        },
        outputSlot1: {
          type: "itemSlot",
          index: 6,
        },
        outputSlot2: {
          type: "itemSlot",
          index: 7,
        },
        outputSlot3: {
          type: "itemSlot",
          index: 8,
        },
        // slots 9-10
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

  const inputState = new BlockStateAccessor<string>(
    e.block,
    "fluffyalien_energistics:input",
  );

  const hasHopperBelow = getHopperBelow(e.block);

  let returnAfterHopperInput = false;

  for (const slotId of OUTPUT_SLOT_IDS) {
    const outputItem = await getMachineSlotItem(e.block, slotId);
    if (!outputItem) continue;

    if (!hasHopperBelow) {
      progressMap.delete(uid);
      inputState.set("none");
      returnAfterHopperInput = true;
      break;
    }

    // take the item out before handing it to the hopper, so we can't give the
    // hopper a copy of an item the take turns out not to have removed.
    const taken = await takeMachineSlotItem(e.block, slotId, 1, {
      expectType: outputItem.typeId,
    });

    if (!taken) {
      returnAfterHopperInput = true;
      break;
    }

    if (!depositItemToHopper(e.block, taken.toItemStack())) {
      await addMachineSlotItem(e.block, slotId, taken);
      progressMap.delete(uid);
      inputState.set("none");
      returnAfterHopperInput = true;
      break;
    }

    if (outputItem.amount > 1) {
      progressMap.delete(uid);
      inputState.set("none");
    }

    returnAfterHopperInput = true;
    break;
  }

  const inputItem = await getInputItemWithHopperSupport(
    e.block,
    "inputSlot",
    INPUT_ITEM_TYPES,
  );

  if (!inputItem || returnAfterHopperInput) {
    progressMap.delete(uid);
    inputState.set("none");
    return;
  }

  const progress = progressMap.get(uid) ?? 0;
  const storedEnergy = getMachineStorage(e.block, "energy");

  if (
    storedEnergy <
    ENERGY_CONSUMPTION_PER_PROGRESS * (MAX_PROGRESS - progress)
  ) {
    progressMap.delete(uid);
    inputState.set("none");
    return;
  }

  if (progress >= MAX_PROGRESS) {
    progressMap.delete(uid);

    // only produce loot if the input was really consumed
    const consumed = await takeMachineSlotItem(e.block, "inputSlot", 1, {
      expectType: inputItem.typeId,
    });
    if (!consumed) return;

    const loot = LOOT[consumed.typeId];
    const addedCounts = await Promise.all(
      OUTPUT_SLOT_IDS.map((slotId) =>
        addMachineSlotItem(
          e.block,
          slotId,
          new MachineItemStack(weightedRandom(loot)),
        ),
      ),
    );

    if (!addedCounts.some((added) => added > 0)) {
      // every output slot was taken while we waited; give the input back
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

  inputState.set(inputItem.typeId.slice("minecraft:".length));
}

export const centrifugeComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
