import { DimensionLocation } from "@minecraft/server";
import { Description, MachineDefinition, StorageTypeDefinition } from "./registry_types";
export * from "./registry_types";
/**
 * @beta
 * Representation of an item stack stored in a machine inventory.
 */
export interface MachineItemStack {
    /**
     * The index of the item in the slot's `allowedItems`.
     * @see {@link UiItemSlotElement}
     */
    typeIndex: number;
    /**
     * The amount of this item.
     */
    count: number;
}
/**
 * @beta
 * Serializable {@link MachineDefinition}.
 * @see {@link MachineDefinition}, {@link registerMachine}
 */
export interface RegisteredMachine {
    description: Description;
    updateUiEvent?: string;
}
export interface InitOptions {
    namespace: string;
}
/**
 * The amount that each storage bar segment in a machine is worth
 */
export declare const STORAGE_AMOUNT_PER_BAR_SEGMENT = 100;
/**
 * The max storage of each storage type in a machine
 */
export declare const MAX_MACHINE_STORAGE: number;
/**
 * @beta
 * Sets global info to be used by functions in this package.
 */
export declare function init(options: InitOptions): void;
/**
 * @beta
 * Tests whether Bedrock Energistics Core is in the world or not.
 */
export declare function isBedrockEnergisticsCoreInWorld(): boolean;
/**
 * @beta
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 */
export declare function registerMachine(options: MachineDefinition): void;
/**
 * @beta
 * Registers a storage type. This function should be called in the `worldInitialize` after event.
 */
export declare function registerStorageType(definition: StorageTypeDefinition): void;
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
/**
 * @beta
 * Gets the storage of a specific type in a machine.
 * @param loc The location of the machine.
 * @param type The type of storage to get.
 */
export declare function getMachineStorage(loc: DimensionLocation, type: string): number;
/**
 * @beta
 * Sets the storage of a specific type in a machine.
 * @param loc The location of the machine.
 * @param type The type of storage to set.
 * @param value The new value.
 */
export declare function setMachineStorage(loc: DimensionLocation, type: string, value: number): void;
/**
 * @beta
 * Gets an item from a machine inventory.
 * @param loc The location of the machine.
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @returns The {@link MachineItemStack}.
 */
export declare function getItemInMachineSlot(loc: DimensionLocation, slotId: number): MachineItemStack | undefined;
/**
 * @beta
 * Sets an item in a machine inventory
 * @param loc The location of the machine
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @param newItemStack The {@link MachineItemStack} to put in the slot. Pass `undefined` to remove the item in the slot
 */
export declare function setItemInMachineSlot(loc: DimensionLocation, slotId: number, newItemStack?: MachineItemStack): void;
/**
 * @beta
 * Queue sending energy, gas, or fluid over a machine network.
 * @remarks
 * Note: in most cases, prefer {@link generate} over this function.
 * Automatically sets the machine's reserve storage to the amount that was not received.
 * @param blockLocation The location of the machine that is sending the energy, gas, or fluid.
 * @param type The storage type to send.
 * @param amount The amount to send.
 * @throws if `amount` is <= 0
 * @see {@link generate}
 */
export declare function queueSend(blockLocation: DimensionLocation, type: string, amount: number): void;
/**
 * @beta
 * Sends energy, gas, or fluid over a machine network. Includes reserve storage as well.
 * @remarks
 * This function should be called every block tick for generators even if the generation is `0` because it sends reserve storage.
 * Automatically sets the machine's reserve storage to the amount that was not received.
 * This function is a wrapper around {@link queueSend}.
 * Unlike `queueSend`, this function does not throw if `amount` <= 0.
 * @param blockLocation The location of the machine that is generating.
 * @param type The storage type to generate.
 * @param amount The amount to generate
 * @see {@link queueSend}
 */
export declare function generate(blockLocation: DimensionLocation, type: string, amount: number): void;
/**
 * @beta
 * Gets a {@link RegisteredMachine} with the specified `id` or `null` if it doesn't exist.
 * @param id The ID of the machine.
 * @returns The RegisteredMachine with the specified `id` or `null` if it doesn't exist.
 * @throws if Bedrock Energistics Core takes too long to respond.
 */
export declare function getRegisteredMachine(id: string): Promise<RegisteredMachine | null>;
