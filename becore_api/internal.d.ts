import { DimensionLocation, ScoreboardObjective, Vector3 } from "@minecraft/server";
export interface SerializableDimensionLocation extends Vector3 {
    dimension: string;
}
export declare function makeSerializableDimensionLocation(loc: DimensionLocation): SerializableDimensionLocation;
export declare function deserializeDimensionLocation(loc: SerializableDimensionLocation): DimensionLocation;
export declare function getBlockUniqueId(loc: DimensionLocation): string;
export declare function getStorageScoreboardObjective(type: string): ScoreboardObjective | undefined;
export declare function getItemTypeScoreboardObjective(slot: number): ScoreboardObjective;
export declare function getItemCountScoreboardObjective(slot: number): ScoreboardObjective;
export declare function getScore(objective: ScoreboardObjective, participant: string): number | undefined;
export declare function makeErrorString(message: string): string;
