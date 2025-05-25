import {
  Block,
  ContainerSlot,
  DimensionLocation,
  GameMode,
  Player,
} from "@minecraft/server";
import {
  getMachineSlotItem,
  MachineItemStack,
  setMachineSlotItem,
} from "bedrock-energistics-core-api";
import {
  depositItemToHopper,
  getFirstSlotWithItemInConnectedHoppers,
  getHopperBelow,
} from "./block";

export function decrementSlot(slot: ContainerSlot, decrement = 1): void {
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
  if (player.getGameMode() === GameMode.creative) {
    return;
  }

  decrementSlot(slot, decrement);
}

export function decrementMachineSlot(
  machine: DimensionLocation,
  slotId: string,
  item: MachineItemStack,
  decrement = 1,
): void {
  const newAmount = item.amount - decrement;

  if (newAmount <= 0) {
    setMachineSlotItem(machine, slotId);
    return;
  }

  item.amount = newAmount;
  setMachineSlotItem(machine, slotId, item);
}

export async function getOutputItemWithHopperSupport(
  block: Block,
  slotId: string,
): Promise<MachineItemStack | undefined> {
  const outputItem = await getMachineSlotItem(block, slotId);
  if (outputItem && getHopperBelow(block)) {
    const itemStack = outputItem.toItemStack();
    if (depositItemToHopper(block, itemStack)) {
      decrementMachineSlot(block, slotId, outputItem);
    }
  }
  return outputItem;
}

export async function getInputItemWithHopperSupport(
  block: Block,
  slotId: string,
  allowedItems?: string[],
): Promise<MachineItemStack | undefined> {
  let inputItem = await getMachineSlotItem(block, slotId);

  if (inputItem) {
    const itemStack = inputItem.toItemStack();
    if (itemStack.amount < itemStack.maxAmount) {
      const hopperSlot = getFirstSlotWithItemInConnectedHoppers(block, [
        itemStack.typeId,
      ]);

      if (hopperSlot) {
        inputItem.amount++;
        setMachineSlotItem(block, slotId, inputItem);
        decrementSlot(hopperSlot);
      }
    }
  } else {
    const hopperSlot = getFirstSlotWithItemInConnectedHoppers(
      block,
      allowedItems,
    );

    if (hopperSlot) {
      inputItem = MachineItemStack.fromItemStack(hopperSlot.getItem()!);
      setMachineSlotItem(block, slotId, inputItem);
      decrementSlot(hopperSlot);
    }
  }

  return inputItem;
}

export function getItemTranslationKey(itemId: string): string {
  if (itemId.startsWith("minecraft:")) {
    return `item.${itemId.slice("minecraft:".length)}.name`;
  }
  return `item.${itemId}`;
}
