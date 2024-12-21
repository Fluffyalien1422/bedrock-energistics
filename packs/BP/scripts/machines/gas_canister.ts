import { StandardStorageType } from "bedrock-energistics-core-api";
import { GenericStorageTypeContainerMachine } from "./shared/generic_storage_type_container";

const ACCEPTED_TYPES: StandardStorageType[] = [
  StandardStorageType.Ammonia,
  StandardStorageType.Carbon,
  StandardStorageType.Hydrogen,
  StandardStorageType.Nitrogen,
  StandardStorageType.Oxygen,
];

export const gasCanisterMachine = new GenericStorageTypeContainerMachine(
  "fluffyalien_energistics:gas_canister",
  ACCEPTED_TYPES,
);
