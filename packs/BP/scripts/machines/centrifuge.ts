import { MachineDefinition } from "@/becore_api";

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

const LOOT = [
  {
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
  {
    "minecraft:diamond": 1,
    "minecraft:emerald": 1,
    "minecraft:prismarine_shard": 3,
    "minecraft:prismarine_crystals": 3,
    "minecraft:heart_of_the_sea": 4,
    "minecraft:iron_nugget": 5,
    "minecraft:gold_nugget": 5,
    "minecraft:nautilus_shell": 6,
    "minecraft:clay_ball": 6,
    "minecraft:turtle_scute": 6,
  },
  {
    "minecraft:diamond": 1,
    "minecraft:emerald": 1,
    "minecraft:amethyst_shard": 2,
    "minecraft:iron_nugget": 4,
    "minecraft:gold_nugget": 4,
    "minecraft:coal": 5,
    "minecraft:flint": 6,
  },
  {
    "minecraft:blaze_powder": 1,
    "minecraft:nether_wart": 1,
    "minecraft:ghast_tear": 2,
    "minecraft:quartz": 3,
  },
];

export const centrifugeMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:centrifuge",
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
};
