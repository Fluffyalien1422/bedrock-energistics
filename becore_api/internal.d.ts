import { DimensionLocation, ScoreboardObjective, Vector3 } from "@minecraft/server";
import { StorageType } from "./registry_types";
export interface SerializableDimensionLocation extends Vector3 {
    dimension: string;
}
export declare function makeSerializableDimensionLocation(loc: DimensionLocation): SerializableDimensionLocation;
export declare function deserializeDimensionLocation(loc: SerializableDimensionLocation): DimensionLocation;
export declare function getBlockUniqueId(loc: DimensionLocation): string;
export declare function getStorageScoreboard(type: StorageType): ScoreboardObjective;
export declare function getItemTypeScoreboard(slot: number): ScoreboardObjective;
export declare function getItemCountScoreboard(slot: number): ScoreboardObjective;
export declare function getScore(objective: ScoreboardObjective, participant: string): number | undefined;
export declare function logInfo(message: string): void;
