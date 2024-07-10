import { DimensionLocation } from "@minecraft/server";
import { RegisterMachineOptions, StorageType } from "./registry_types";
export * from "./registry_types";
/**
 * Representation of an item stack stored in a machine inventory.
 */
export interface MachineItemStack {
    /**
     * The index of the item in the slot's `allowedItems`.
     * @see {@link UiItemSlotElement}
     */
    type: number;
    /**
     * The amount of this item.
     */
    count: number;
}
/**
 * @beta
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 */
export declare function registerMachine(options: RegisterMachineOptions): void;
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
export declare function getMachineStorage(loc: DimensionLocation, type: StorageType): number;
/**
 * @beta
 * Sets the storage of a specific type in a machine.
 * @param loc The location of the machine.
 * @param type The type of storage to set.
 * @param value The new value.
 */
export declare function setMachineStorage(loc: DimensionLocation, type: StorageType, value: number): void;
/**
 * Gets an item from a machine inventory.
 * @param loc The location of the machine.
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @returns The {@link MachineItemStack}.
 */
export declare function getItemInMachineSlot(loc: DimensionLocation, slotId: number): MachineItemStack | undefined;
/**
 * Sets an item in a machine inventory
 * @param loc The location of the machine
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @param newItemStack The {@link MachineItemStack} to put in the slot. Pass `undefined` to remove the item in the slot
 */
export declare function setItemInMachineSlot(loc: DimensionLocation, slotId: number, newItemStack?: MachineItemStack): void;
/**
 * Note: in most cases, prefer {@link generate} over this function.
 * Queue sending energy, gas, or fluid over a machine network.
 * Automatically sets the machine's reserve storage to the amount that was not received.
 * @param blockLocation The location of the machine that is sending the energy, gas, or fluid.
 * @param type The storage type to send.
 * @param amount The amount to send.
 * @see {@link generate}
 */
export declare function queueSend(blockLocation: DimensionLocation, type: StorageType, amount: number): void;
/**
 * Sends energy, gas, or fluid over a machine network. Includes reserve storage as well.
 * @param blockLocation The location of the machine that is generating.
 * @param type The storage type to generate.
 * @param amount The amount to generate
 * @see {@link queueSend}
 */
export declare function generate(blockLocation: DimensionLocation, type: StorageType, amount: number): void;
