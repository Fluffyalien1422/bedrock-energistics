import { world } from "@minecraft/server";
import {
  registerMachine,
  registerStorageType,
} from "bedrock-energistics-core-api";
import { solarPanelMachine } from "./machines/solar_panel";
import { crusherMachine } from "./machines/crusher";
import { oilExtractorMachine } from "./machines/oil_extractor";
import { oilGeneratorMachine } from "./machines/oil_generator";
import { atmosphericCondenserMachine } from "./machines/atmospheric_condenser";
import { poweredFurnaceMachine } from "./machines/powered_furnace";
import { coalGeneratorMachine } from "./machines/coal_generator";
import { centrifugeMachine } from "./machines/centrifuge";
import { organicGeneratorMachine } from "./machines/organic_generator";
import { blockBreakerMachine } from "./machines/block_breaker";

world.afterEvents.worldInitialize.subscribe(() => {
  registerStorageType({
    id: "oil",
    category: "fluid",
    color: "black",
    name: "oil",
  });
  registerStorageType({
    id: "hydrogen",
    category: "gas",
    color: "pink",
    name: "hydrogen",
  });
  registerStorageType({
    id: "carbon",
    category: "gas",
    color: "red",
    name: "carbon",
  });
  registerStorageType({
    id: "nitrogen",
    category: "gas",
    color: "purple",
    name: "nitrogen",
  });

  registerMachine(solarPanelMachine);
  registerMachine(crusherMachine);
  registerMachine(oilExtractorMachine);
  registerMachine(oilGeneratorMachine);
  registerMachine(atmosphericCondenserMachine);
  registerMachine(poweredFurnaceMachine);
  registerMachine(coalGeneratorMachine);
  registerMachine(centrifugeMachine);
  registerMachine(organicGeneratorMachine);
  registerMachine(blockBreakerMachine);
});
