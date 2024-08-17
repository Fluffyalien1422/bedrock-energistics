import { Block, DimensionLocation } from "@minecraft/server";
import { MachineDefinition, StorageTypeDefinition, UiElement } from "./registry_types";
import { MangledRegisteredMachine } from "./internal";
export * from "./registry_types";
/**
 * Representation of an item stack stored in a machine inventory.
 * @beta
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
 */
export interface InitOptions {
    namespace: string;
}
/**
 * The amount that each storage bar segment in a machine is worth.
 * @beta
 */
export declare const STORAGE_AMOUNT_PER_BAR_SEGMENT = 100;
/**
 * The max storage of each storage type in a machine.
 * @beta
 */
export declare const MAX_MACHINE_STORAGE: number;
/**
 * Representation of a machine definition that has been registered.
 * @beta
 * @see {@link MachineDefinition}, {@link registerMachine}, {@link getRegisteredMachine}
 */
export declare class RegisteredMachine {
    protected readonly internal: MangledRegisteredMachine;
    /**
     * @internal This class shouldn't be manually constructed. Use {@link getRegisteredMachine} to get this object.
     */
    constructor(internal: MangledRegisteredMachine);
    get id(): string;
    get persistentEntity(): boolean;
    get uiElements(): Record<string, UiElement> | undefined;
}
/**
 * Sets global info to be used by functions in this package.
 * @beta
 */
export declare function init(options: InitOptions): void;
/**
 * Tests whether Bedrock Energistics Core is in the world or not.
 * @beta
 */
export declare function isBedrockEnergisticsCoreInWorld(): boolean;
/**
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 * @param shortId If a handler event cannot be created because the block ID is too long, pass a string here to use it as the prefix instead of the block ID.
 * @param fallbackToStream If the {@link MachineDefinition} cannot be sent, fall back to streaming.
 * @throws If the block ID is too long and a handler is defined, this function will throw an error. Pass `shortId` to use that as the prefix for handler event IDs instead of the block ID.
 * @beta
 */
export declare function registerMachine(definition: MachineDefinition, shortId?: string, fallbackToStream?: boolean): void;
/**
 * Registers a storage type. This function should be called in the `worldInitialize` after event.
 * @beta
 */
export declare function registerStorageType(definition: StorageTypeDefinition): void;
/**
 * Updates the networks that a block belongs to, if it has any.
 * @beta
 */
export declare function updateBlockNetworks(blockLocation: DimensionLocation): void;
/**
 * Updates the networks adjacent to a block that the block can connect to.
 * @beta
 */
export declare function updateBlockConnectableNetworks(blockLocation: DimensionLocation): void;
/**
 * Updates the networks adjacent to a block.
 * @beta
 */
export declare function updateBlockAdjacentNetworks(blockLocation: DimensionLocation): void;
/**
 * Gets the storage of a specific type in a machine.
 * @beta
 * @param loc The location of the machine.
 * @param type The type of storage to get.
 * @throws Throws {@link Error} if the storage type does not exist
 */
export declare function getMachineStorage(loc: DimensionLocation, type: string): number;
/**
 * Sets the storage of a specific type in a machine.
 * @beta
 * @param block The machine block.
 * @param type The type of storage to set.
 * @param value The new value. Must be an integer.
 * @throws Throws if the storage type does not exist.
 * @throws Throws if the new value is negative or greater than {@link MAX_MACHINE_STORAGE}.
 * @throws Throws if the new value is not an integer.
 * @throws Throws if the block is not valid
 */
export declare function setMachineStorage(block: Block, type: string, value: number): void;
/**
 * Gets an item from a machine inventory.
 * @beta
 * @param loc The location of the machine.
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @returns The {@link MachineItemStack}.
 */
export declare function getItemInMachineSlot(loc: DimensionLocation, slotId: number): MachineItemStack | undefined;
/**
 * Sets an item in a machine inventory.
 * @beta
 * @param loc The location of the machine.
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @param newItemStack The {@link MachineItemStack} to put in the slot. Pass `undefined` to remove the item in the slot.
 */
export declare function setItemInMachineSlot(loc: DimensionLocation, slotId: number, newItemStack?: MachineItemStack): void;
/**
 * Queue sending energy, gas, or fluid over a machine network.
 * @beta
 * @remarks
 * Note: in most cases, prefer {@link generate} over this function.
 * Automatically sets the machine's reserve storage to the amount that was not received.
 * @param blockLocation The location of the machine that is sending the energy, gas, or fluid.
 * @param type The storage type to send.
 * @param amount The amount to send.
 * @throws if `amount` is <= 0.
 * @see {@link generate}
 */
export declare function queueSend(blockLocation: DimensionLocation, type: string, amount: number): void;
/**
 * Sends energy, gas, or fluid over a machine network. Includes reserve storage as well.
 * @beta
 * @remarks
 * This function should be called every block tick for generators even if the generation is `0` because it sends reserve storage.
 * Automatically sets the machine's reserve storage to the amount that was not received.
 * This function is a wrapper around {@link queueSend}.
 * Unlike `queueSend`, this function does not throw if `amount` <= 0.
 * @param blockLocation The location of the machine that is generating.
 * @param type The storage type to generate.
 * @param amount The amount to generate.
 * @see {@link queueSend}
 */
export declare function generate(blockLocation: DimensionLocation, type: string, amount: number): void;
/**
 * Gets a registered machine.
 * @beta
 * @param id The ID of the machine.
 * @returns The {@link RegisteredMachine} with the specified `id` or `null` if it doesn't exist.
 * @throws if Bedrock Energistics Core takes too long to respond.
 */
export declare function getRegisteredMachine(id: string): Promise<RegisteredMachine | null>;
/**
 * Cleans up machine data and updates it's networks.
 * @beta
 * @remarks
 * This is automatically done by Bedrock Energistics Core when a machine is destroyed by a player.
 * If you destroy a machine from script, call this function before the block is removed.
 * @param blockLocation The location of the machine.
 */
export declare function removeMachine(blockLocation: DimensionLocation): void;
