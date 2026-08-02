import { Block, ContainerSlot, GameMode, Player } from "@minecraft/server";
import {
  addMachineSlotItem,
  getMachineSlotItem,
  MachineItemStack,
  takeMachineSlotItem,
} from "bedrock-energistics-core-api";
import {
  depositItemToHopper,
  getFirstSlotWithItemInConnectedHoppers,
  getHopperBelow,
} from "./block";

export function decrementSlot(slot: ContainerSlot, decrement = 1): void {
  // machine slot operations are async, so a hopper slot we looked at before
  // awaiting one may have been emptied or unloaded by the time we get here.
  if (!slot.isValid || !slot.hasItem()) {
    return;
  }

  const newAmount = slot.amount - decrement;

  if (newAmount <= 0) {
    slot.setItem();
    return;
  }

  slot.amount = newAmount;
}

export function decrementSlotSurvival(
  player: Player,
  slot: ContainerSlot,
  decrement = 1,
): void {
  if (player.getGameMode() === GameMode.Creative) {
    return;
  }

  decrementSlot(slot, decrement);
}

/**
 * moves one item from a machine slot into the hopper below `block`, if there is
 * one.
 * @returns the contents of the slot, as far as we know them.
 */
export async function getOutputItemWithHopperSupport(
  block: Block,
  slotId: string,
): Promise<MachineItemStack | undefined> {
  const outputItem = await getMachineSlotItem(block, slotId);
  if (!outputItem || !getHopperBelow(block)) {
    return outputItem;
  }

  // take the item out before handing it to the hopper. depositing first and
  // removing after would give the hopper a copy of an item that the take may
  // then turn out not to have removed.
  const taken = await takeMachineSlotItem(block, slotId, 1, {
    expectType: outputItem.typeId,
  });
  if (!taken) {
    return outputItem;
  }

  if (!depositItemToHopper(block, taken.toItemStack())) {
    await addMachineSlotItem(block, slotId, taken);
    return outputItem;
  }

  return outputItem.amount > 1
    ? outputItem.withAmount(outputItem.amount - 1)
    : undefined;
}

/**
 * moves one item from the connected hoppers into a machine slot.
 * @param allowedItems which items may be pulled in when the slot is empty. once
 * it holds something, only more of that item is pulled in.
 * @returns the contents of the slot, as far as we know them.
 */
export async function getInputItemWithHopperSupport(
  block: Block,
  slotId: string,
  allowedItems?: string[],
): Promise<MachineItemStack | undefined> {
  const inputItem = await getMachineSlotItem(block, slotId);

  const hopperSlot = getFirstSlotWithItemInConnectedHoppers(
    block,
    inputItem ? [inputItem.typeId] : allowedItems,
  );
  if (!hopperSlot) {
    return inputItem;
  }

  // move the hopper's own item rather than a copy of whatever is already in the
  // slot: the two share a type but can differ in damage, name or enchantments.
  const itemToAdd = MachineItemStack.fromItemStack(
    hopperSlot.getItem()!,
  ).withAmount(1);

  // a full slot, or one that changed under us, just accepts nothing. only take
  // from the hopper what the slot really took.
  const added = await addMachineSlotItem(block, slotId, itemToAdd);
  if (!added) {
    return inputItem;
  }

  decrementSlot(hopperSlot, added);

  return inputItem ? inputItem.withAmount(inputItem.amount + added) : itemToAdd;
}

export function getItemTranslationKey(itemId: string): string {
  if (itemId.startsWith("minecraft:")) {
    return `item.${itemId.slice("minecraft:".length)}.name`;
  }
  return `item.${itemId}`;
}
