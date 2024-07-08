import { DimensionLocation } from "@minecraft/server";
import { RegisteredMachine } from "./registry_types";
export * from "./registry_types";
export { getMachineStorage, setMachineStorage } from "./machine_data";
/**
 * @beta
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 */
export declare function registerMachine(options: RegisteredMachine): void;
/**
 * @beta
 * Updates the network that a block belongs to, if it has one.
 */
export declare function updateBlockNetwork(blockLocation: DimensionLocation): void;
/**
 * @beta
 * Updates the networks adjacent to a block.
 */
export declare function updateBlockAdjacentNetworks(blockLocation: DimensionLocation): void;
