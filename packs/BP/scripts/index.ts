import { world } from "@minecraft/server";
import { registerMachine } from "./core_interface";

world.afterEvents.worldInitialize.subscribe(() => {
  registerMachine({
    id: "fluffyalien_energistics:solar_panel",
    uiElements: {
      energyBar: {
        type: "storageBar",
        startIndex: 0,
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
});
