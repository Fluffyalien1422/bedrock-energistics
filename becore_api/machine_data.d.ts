import { DimensionLocation, ScoreboardObjective } from "@minecraft/server";
import { StorageType } from "./registry_types";
export declare function getBlockUniqueId(loc: DimensionLocation): string;
export declare function getScore(objective: ScoreboardObjective, participant: string): number | undefined;
/**
 * Gets the storage of a specific type in a machine
 * @param loc the location of the machine
 * @param type the type of storage to get
 */
export declare function getMachineStorage(loc: DimensionLocation, type: StorageType): number;
/**
 * Sets the storage of a specific type in a machine
 * @param loc the location of the machine
 * @param type the type of storage to set
 * @param value the new value
 */
export declare function setMachineStorage(loc: DimensionLocation, type: StorageType, value: number): void;
