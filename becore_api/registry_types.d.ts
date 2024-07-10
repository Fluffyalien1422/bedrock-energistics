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
export interface UiOptions {
    elements: Record<string, UiElement>;
}
export interface Description {
    id: string;
    ui?: UiOptions;
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
    handlers?: Handlers;
}
