import { world } from "@minecraft/server";

world.afterEvents.worldInitialize.subscribe(() => {
  world.getDimension("overworld").runCommand(
    `scriptevent fluffyalien_energisticscore:register_machine ${JSON.stringify({
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
    })}`,
  );
});
