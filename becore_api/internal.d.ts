import { DimensionLocation, ScoreboardObjective, Vector3 } from "@minecraft/server";
import { UiElement } from "./registry_types";
export interface SerializableDimensionLocation extends Vector3 {
    dimension: string;
}
export interface MangledRegisteredMachine {
    /**
     * Description.id
     */
    a: string;
    /**
     * Description.persistentEntity
     */
    b?: boolean;
    /**
     * UiOptions.elements
     */
    c?: Record<string, UiElement>;
    /**
     * updateUiEvent
     */
    d?: string;
}
export declare function makeSerializableDimensionLocation(loc: DimensionLocation): SerializableDimensionLocation;
export declare function deserializeDimensionLocation(loc: SerializableDimensionLocation): DimensionLocation;
export declare function getBlockUniqueId(loc: DimensionLocation): string;
export declare function getStorageScoreboardObjective(type: string): ScoreboardObjective | undefined;
export declare function getItemTypeScoreboardObjective(slot: number): ScoreboardObjective;
export declare function getItemCountScoreboardObjective(slot: number): ScoreboardObjective;
export declare function getScore(objective: ScoreboardObjective, participant: string): number | undefined;
export declare function removeBlockFromScoreboards(loc: DimensionLocation): void;
export declare function makeErrorString(message: string): string;
