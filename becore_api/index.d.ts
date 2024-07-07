import { RegisteredMachine } from "./registry_types";
export * from "./registry_types";
export { getMachineStorage, setMachineStorage } from "./machine_data";
/**
 * @beta
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 */
export declare function registerMachine(options: RegisteredMachine): void;
