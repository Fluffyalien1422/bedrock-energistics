import {
  ContainerSlot,
  DimensionLocation,
  GameMode,
  Player,
} from "@minecraft/server";
import {
  MachineItemStack,
  setMachineSlotItem,
} from "bedrock-energistics-core-api";

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
  slotId: number,
  item: MachineItemStack,
  decrement = 1,
): void {
  const newAmount = item.count - decrement;

  if (newAmount <= 0) {
    setMachineSlotItem(machine, slotId);
    return;
  }

  item.count = newAmount;
  setMachineSlotItem(machine, slotId, item);
}
