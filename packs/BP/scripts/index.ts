import { world } from "@minecraft/server";
import { registerMachine } from "./core_interface";

world.afterEvents.worldInitialize.subscribe(() => {
  registerMachine({
    description: {
      id: "fluffyalien_energistics:solar_panel",
      uiElements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
      },
    },
    systems: {
      solarGenerator: {
        baseGeneration: 2,
        rainGeneration: 1,
        outputBar: "energyBar",
      },
    },
  });

  registerMachine({
    description: {
      id: "fluffyalien_energistics:crusher",
      workingState: "fluffyalien_energistics:working",
      uiElements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
        inputSlot: {
          type: "itemSlot",
          index: 4,
          slotId: 0,
          allowedItems: [
            "minecraft:stone",
            "minecraft:cobblestone",
            "minecraft:gravel",
          ],
        },
        arrowIndicator: {
          type: "progressIndicator",
          indicator: "arrow",
          index: 5,
        },
        outputSlot: {
          type: "itemSlot",
          index: 6,
          slotId: 1,
          allowedItems: [
            "minecraft:cobblestone",
            "minecraft:gravel",
            "minecraft:sand",
          ],
        },
      },
    },
    systems: {
      timedCrafting: {
        progressIndicator: "arrowIndicator",
        storageBars: [
          {
            type: "energy",
            element: "energyBar",
          },
        ],
        recipes: [
          {
            maxProgress: 10,
            consumption: [
              {
                type: "energy",
                amountPerProgress: 10,
              },
            ],
            ingredients: [
              {
                item: "minecraft:stone",
                slot: "inputSlot",
              },
            ],
            result: [
              {
                item: "minecraft:cobblestone",
                slot: "outputSlot",
              },
            ],
          },
          {
            maxProgress: 10,
            consumption: [
              {
                type: "energy",
                amountPerProgress: 10,
              },
            ],
            ingredients: [
              {
                item: "minecraft:cobblestone",
                slot: "inputSlot",
              },
            ],
            result: [
              {
                item: "minecraft:gravel",
                slot: "outputSlot",
              },
            ],
          },
          {
            maxProgress: 10,
            consumption: [
              {
                type: "energy",
                amountPerProgress: 10,
              },
            ],
            ingredients: [
              {
                item: "minecraft:gravel",
                slot: "inputSlot",
              },
            ],
            result: [
              {
                item: "minecraft:sand",
                slot: "outputSlot",
              },
            ],
          },
        ],
      },
    },
  });
});
