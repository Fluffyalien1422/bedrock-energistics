import {
  getMachineSlotItem,
  getMachineStorage,
  MachineDefinition,
  MachineItemStack,
  setMachineSlotItem,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import {
  BlockComponentTickEvent,
  BlockCustomComponent,
  ItemStack,
} from "@minecraft/server";
import { blockLocationToUid } from "../utils/location";
import {
  BlockStateAccessor,
  depositItemToHopper,
  getFirstSlotWithItemInConnectedHoppers,
  getHopperBelow,
} from "../utils/block";
import { decrementSlot } from "../utils/item";
import { weightedRandom } from "../utils/math";

const OUTPUT_ITEM_TYPES = [
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
  "minecraft:diamond",
  "minecraft:emerald",
  "minecraft:prismarine_shard",
  "minecraft:prismarine_crystals",
  "minecraft:heart_of_the_sea",
  "minecraft:iron_nugget",
  "minecraft:gold_nugget",
  "minecraft:nautilus_shell",
  "minecraft:clay_ball",
  "minecraft:turtle_scute",
  "minecraft:amethyst_shard",
  "minecraft:coal",
  "minecraft:flint",
  "minecraft:blaze_powder",
  "minecraft:nether_wart",
  "minecraft:ghast_tear",
  "minecraft:quartz",
];

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

const ENERGY_CONSUMPTION_PER_PROGRESS = 20;

const MAX_PROGRESS = 32;

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
          slotId: 0,
          allowedItems: INPUT_ITEM_TYPES,
        },
        arrowIndicator: {
          type: "progressIndicator",
          index: 9,
          indicator: "arrow",
        },
        outputSlot0: {
          type: "itemSlot",
          index: 5,
          slotId: 1,
          allowedItems: OUTPUT_ITEM_TYPES,
        },
        outputSlot1: {
          type: "itemSlot",
          index: 6,
          slotId: 2,
          allowedItems: OUTPUT_ITEM_TYPES,
        },
        outputSlot2: {
          type: "itemSlot",
          index: 7,
          slotId: 3,
          allowedItems: OUTPUT_ITEM_TYPES,
        },
        outputSlot3: {
          type: "itemSlot",
          index: 8,
          slotId: 4,
          allowedItems: OUTPUT_ITEM_TYPES,
        },
      },
    },
  },
  handlers: {
    updateUi({ blockLocation: location }) {
      const uid = blockLocationToUid(location);

      return {
        progressIndicators: {
          arrowIndicator: Math.floor((progressMap.get(uid) ?? 0) / 2),
        },
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

  for (let i = 0; i < 4; i++) {
    const slotId = i + 1;
    const outputItem = await getMachineSlotItem(e.block, slotId);
    if (!outputItem) continue;

    if (!hasHopperBelow) {
      progressMap.delete(uid);
      inputState.set("none");
      returnAfterHopperInput = true;
      break;
    }

    const itemStack = new ItemStack(outputItem.typeId);

    if (!depositItemToHopper(e.block, itemStack)) {
      progressMap.delete(uid);
      inputState.set("none");
      returnAfterHopperInput = true;
      break;
    }

    outputItem.amount--;
    if (outputItem.amount > 0) {
      setMachineSlotItem(e.block, slotId, outputItem);
      progressMap.delete(uid);
      inputState.set("none");
      returnAfterHopperInput = true;
      break;
    } else {
      setMachineSlotItem(e.block, slotId);
    }

    returnAfterHopperInput = true;
    break;
  }

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
      INPUT_ITEM_TYPES,
    );

    if (hopperSlot) {
      inputItem = new MachineItemStack(hopperSlot.typeId);
      setMachineSlotItem(e.block, 0, inputItem);
      decrementSlot(hopperSlot);
    }
  }

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
    inputItem.amount--;
    setMachineSlotItem(
      e.block,
      0,
      inputItem.amount > 0 ? inputItem : undefined,
    );

    for (let i = 0; i < 4; i++) {
      const itemId = weightedRandom(LOOT[inputItem.typeId]);
      const slotId = i + 1;
      setMachineSlotItem(e.block, slotId, new MachineItemStack(itemId));
    }

    progressMap.delete(uid);
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
