import { world } from "@minecraft/server";
import { registerMachine } from "@/becore_api";
import { solarPanelMachine } from "./machines/solar_panel";
import { crusherMachine } from "./machines/crusher";
import { oilExtractorMachine } from "./machines/oil_extractor";

world.afterEvents.worldInitialize.subscribe(() => {
  registerMachine(solarPanelMachine);
  registerMachine(crusherMachine);
  registerMachine(oilExtractorMachine);
});
