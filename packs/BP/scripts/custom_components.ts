import { world } from "@minecraft/server";
import {
  energyConduitComponent,
  fluidConduitComponent,
  gasConduitComponent,
  multiConduitComponent,
} from "./conduits";
import { solarPanelComponent } from "./machines/solar_panel";

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
});
