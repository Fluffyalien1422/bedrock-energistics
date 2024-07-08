import { ContainerSlot, GameMode, Player } from "@minecraft/server";

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
