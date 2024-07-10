import { DimensionLocation } from "@minecraft/server";
export type StorageType = "energy" | "oil";
export type UiProgressIndicatorElementType = "arrow";
export interface UiStorageBarElement {
    type: "storageBar";
    startIndex: number;
}
export interface UiItemSlotElement {
    type: "itemSlot";
    index: number;
    slotId: number;
    allowedItems: string[];
}
export interface UiProgressIndicatorElement {
    type: "progressIndicator";
    indicator: UiProgressIndicatorElementType;
    index: number;
}
export type UiElement = UiStorageBarElement | UiItemSlotElement | UiProgressIndicatorElement;
export interface SolarGeneratorSystemOptions {
    system: "solarGenerator";
    baseGeneration: number;
    rainGeneration: number;
    outputBar: string;
}
export interface TimedCraftingSystemRecipeConsumption {
    type: StorageType;
    amountPerProgress: number;
}
export interface TimedCraftingSystemRecipeIngredient {
    slot: string;
    item: string;
}
export interface TimedCraftingSystemRecipeResult {
    slot: string;
    item: string;
    count?: number;
}
export interface TimedCraftingSystemRecipe {
    maxProgress: number;
    consumption: TimedCraftingSystemRecipeConsumption[];
    ingredients: TimedCraftingSystemRecipeIngredient[];
    result: TimedCraftingSystemRecipeResult[];
}
export interface TimedCraftingSystemStorageBarOptions {
    type: StorageType;
    element: string;
}
export interface TimedCraftingSystemOptions {
    system: "timedCrafting";
    progressIndicator: string;
    storageBars: TimedCraftingSystemStorageBarOptions[];
    recipes: TimedCraftingSystemRecipe[];
}
export type SystemOptions = SolarGeneratorSystemOptions | TimedCraftingSystemOptions;
export interface StateManagerAnyOrAllCondition {
    test: "any" | "all";
    conditions: StateManagerCondition[];
}
export interface StateManagerNumberCondition {
    test: "storedEnergy" | "energyChange";
    operator: "<" | ">" | "==" | "!=";
    value: number;
}
export type StateManagerCondition = StateManagerNumberCondition | StateManagerAnyOrAllCondition;
export interface StateManagerState {
    state: string;
    value: string | number | boolean;
    condition: StateManagerCondition;
}
export interface StateManager {
    states: StateManagerState[];
}
export interface Description {
    id: string;
    uiElements: Record<string, UiElement>;
    stateManager?: StateManager;
}
export interface UiElementUpdateOptions {
    element: string;
}
export interface UiStorageBarUpdateOptions extends UiElementUpdateOptions {
    type: StorageType;
    change: number;
}
export interface UpdateUiHandlerResponse {
    storageBars?: UiStorageBarUpdateOptions[];
    progressIndicators?: Record<string, number>;
}
export interface Handlers {
    updateUi?(blockLocation: DimensionLocation): UpdateUiHandlerResponse;
}
export interface RegisterMachineOptions {
    description: Description;
    handlers: Handlers;
}
