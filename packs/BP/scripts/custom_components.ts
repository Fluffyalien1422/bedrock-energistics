import { world } from "@minecraft/server";
import {
  energyConduitComponent,
  fluidConduitComponent,
  gasConduitComponent,
  multiConduitComponent,
} from "./conduits";

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
});
