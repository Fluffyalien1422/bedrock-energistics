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
import { oilGeneratorComponent } from "./machines/oil_generator";
import { atmosphericCondenserComponent } from "./machines/atmospheric_condenser";
import { poweredFurnaceComponent } from "./machines/powered_furnace";
import { coalGeneratorComponent } from "./machines/coal_generator";
import { centrifugeComponent } from "./machines/centrifuge";
import { organicGeneratorComponent } from "./machines/organic_generator";
import { blockBreakerComponent } from "./machines/block_breaker";
import { blockPlacerComponent } from "./machines/block_placer";
import { voidMinerComponent } from "./machines/void_miner";
import { fluidSeparatorComponent } from "./machines/fluid_separator";
import { ammoniaFactoryComponent } from "./machines/ammonia_factory";
import { ammoniaGeneratorComponent } from "./machines/ammonia_generator";
import { disposalUnitComponent } from "./machines/disposal_unit";
import { genericStorageTypeContainerComponent } from "./machines/shared/generic_storage_type_container";
import { batteryComponent } from "./machines/battery";

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

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:oil_generator",
    oilGeneratorComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:atmospheric_condenser",
    atmosphericCondenserComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:powered_furnace",
    poweredFurnaceComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:coal_generator",
    coalGeneratorComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:centrifuge",
    centrifugeComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:organic_generator",
    organicGeneratorComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:block_breaker",
    blockBreakerComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:block_placer",
    blockPlacerComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:void_miner",
    voidMinerComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:fluid_separator",
    fluidSeparatorComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:ammonia_factory",
    ammoniaFactoryComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:ammonia_generator",
    ammoniaGeneratorComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:disposal_unit",
    disposalUnitComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:generic_storage_type_container",
    genericStorageTypeContainerComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:battery",
    batteryComponent,
  );
});
