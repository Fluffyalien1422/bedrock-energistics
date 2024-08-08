import { world } from "@minecraft/server";
import { registerMachine, registerStorageType } from "@/becore_api";
import { solarPanelMachine } from "./machines/solar_panel";
import { crusherMachine } from "./machines/crusher";
import { oilExtractorMachine } from "./machines/oil_extractor";
import { oilGeneratorMachine } from "./machines/oil_generator";
import { atmosphericCondenserMachine } from "./machines/atmospheric_condenser";

world.afterEvents.worldInitialize.subscribe(() => {
  registerStorageType({
    id: "oil",
    color: "black",
    name: "oil",
  });
  registerStorageType({
    id: "hydrogen",
    color: "pink",
    name: "hydrogen",
  });
  registerStorageType({
    id: "carbon",
    color: "red",
    name: "carbon",
  });
  registerStorageType({
    id: "nitrogen",
    color: "purple",
    name: "nitrogen",
  });

  registerMachine(solarPanelMachine);
  registerMachine(crusherMachine);
  registerMachine(oilExtractorMachine);
  registerMachine(oilGeneratorMachine);
  registerMachine(atmosphericCondenserMachine);
});
