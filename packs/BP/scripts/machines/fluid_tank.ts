import { StandardStorageType } from "bedrock-energistics-core-api";
import { GenericStorageTypeContainerMachine } from "./shared/generic_storage_type_container";

const ACCEPTED_TYPES: StandardStorageType[] = [
  StandardStorageType.Lava,
  StandardStorageType.Oil,
  StandardStorageType.Water,
];

export const fluidTankMachine = new GenericStorageTypeContainerMachine(
  "fluffyalien_energistics:fluid_tank",
  ACCEPTED_TYPES,
);
