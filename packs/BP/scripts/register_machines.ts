import { world } from "@minecraft/server";
import { registerMachine } from "@/becore_api";
import { solarPanelMachine } from "./machines/solar_panel";

world.afterEvents.worldInitialize.subscribe(() => {
  registerMachine(solarPanelMachine);
});
