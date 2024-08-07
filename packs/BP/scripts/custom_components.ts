import { world } from "@minecraft/server";
import {
  energyConduitComponent,
  fluidConduitComponent,
  gasConduitComponent,
  multiConduitComponent,
} from "./conduits";
import { solarPanelComponent } from "./machines/solar_panel";
import { crusherComponent } from "./machines/crusher";
import { oilExtractorComponent } from "./machines/oil_extractor";

world.beforeEvents.worldInitialize.subscribe((e) => {
  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:energy_conduit",
    energyConduitComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:fluid_conduit",
    fluidConduitComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:gas_conduit",
    gasConduitComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:multi_conduit",
    multiConduitComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:solar_panel",
    solarPanelComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:crusher",
    crusherComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:oil_extractor",
    oilExtractorComponent,
  );
});
