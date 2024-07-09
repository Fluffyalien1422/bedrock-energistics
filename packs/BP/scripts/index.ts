import { world } from "@minecraft/server";
import { registerMachine } from "@/becore_api";

import "./custom_components";

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
    handlers: {
      updateUi() {
        return {
          storageBars: [
            {
              element: "energyBar",
              type: "energy",
              change: 1,
            },
          ],
        };
      },
    },
  });
});
