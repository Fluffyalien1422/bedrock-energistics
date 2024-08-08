import { world } from "@minecraft/server";
import { registerMachine, registerStorageType } from "@/becore_api";
import { solarPanelMachine } from "./machines/solar_panel";
import { crusherMachine } from "./machines/crusher";
import { oilExtractorMachine } from "./machines/oil_extractor";
import { oilGeneratorMachine } from "./machines/oil_generator";

world.afterEvents.worldInitialize.subscribe(() => {
  registerStorageType({
    id: "oil",
    color: "black",
    name: "oil",
  });

  registerMachine(solarPanelMachine);
  registerMachine(crusherMachine);
  registerMachine(oilExtractorMachine);
  registerMachine(oilGeneratorMachine);
});
