import { world } from "@minecraft/server";
import {
  registerMachine,
  StandardStorageType,
  useStandardStorageType,
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
import { blockPlacerMachine } from "./machines/block_placer";
import { voidMinerMachine } from "./machines/void_miner";
import { fluidSeparatorMachine } from "./machines/fluid_separator";
import { ammoniaFactoryMachine } from "./machines/ammonia_factory";
import { ammoniaGeneratorMachine } from "./machines/ammonia_generator";
import { disposalUnitMachine } from "./machines/disposal_unit";
import { gasCanisterMachine } from "./machines/gas_canister";
import { batteryMachine } from "./machines/battery";
import { fluidTankMachine } from "./machines/fluid_tank";
import { pumpMachine } from "./machines/pump";
import { tesseractMachine } from "./machines/tesseract";
import { itemChargerMachine } from "./machines/item_charger";

world.afterEvents.worldInitialize.subscribe(() => {
  useStandardStorageType(StandardStorageType.Oil);
  useStandardStorageType(StandardStorageType.Hydrogen);
  useStandardStorageType(StandardStorageType.Carbon);
  useStandardStorageType(StandardStorageType.Nitrogen);
  useStandardStorageType(StandardStorageType.Water);
  useStandardStorageType(StandardStorageType.Ammonia);
  useStandardStorageType(StandardStorageType.Lava);
  useStandardStorageType(StandardStorageType.Oxygen);

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
  registerMachine(blockPlacerMachine);
  registerMachine(voidMinerMachine);
  registerMachine(fluidSeparatorMachine);
  registerMachine(ammoniaFactoryMachine);
  registerMachine(ammoniaGeneratorMachine);
  registerMachine(disposalUnitMachine);
  registerMachine(gasCanisterMachine);
  registerMachine(batteryMachine);
  registerMachine(fluidTankMachine);
  registerMachine(pumpMachine);
  registerMachine(tesseractMachine);
  registerMachine(itemChargerMachine);
});
