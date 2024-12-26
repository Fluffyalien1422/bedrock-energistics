import { Block, Container, ContainerSlot, ItemStack } from "@minecraft/server";
import { getBlockInDirection, StrDirection } from "./direction";
import { getBlockComponent } from "../polyfills/component_type_map";

/**
 * sets the connect states of a block (eg. `fluffyalien_energistics:north`) to a value returned by a callback function
 */
export async function updateBlockConnectStates<TDirection extends StrDirection>(
  block: Block,
  directions: readonly TDirection[],
  callback: (
    block: Block,
    direction: TDirection,
  ) => string | number | boolean | Promise<string | number | boolean>,
): Promise<void> {
  let permutation = block.permutation;
  let anyStatesChanged = false;

  for (const direction of directions) {
    const blockInDirection = getBlockInDirection(block, direction);
    if (!blockInDirection) {
      continue;
    }

    const stateName = `fluffyalien_energistics:${direction}`;
    const newValue = await callback(blockInDirection, direction);

    if (permutation.getState(stateName) !== newValue) {
      permutation = permutation.withState(stateName, newValue);
      anyStatesChanged = true;
    }
  }

  if (anyStatesChanged) {
    block.setPermutation(permutation);
  }
}

export function getHopperBelow(block: Block): Block | undefined {
  const below = block.below();
  if (below?.typeId !== "minecraft:hopper") {
    return;
  }

  return below;
}

/**
 * deposits an item to a hopper below `block`
 * @returns a boolean indicating whether the item was added or not
 */
export function depositItemToHopper(
  block: Block,
  itemStack: ItemStack,
): boolean {
  const hopper = getHopperBelow(block);
  if (!hopper) {
    return false;
  }

  const container = getBlockComponent(hopper, "inventory")!.container!;

  const itemAdded = !container.addItem(itemStack);

  return itemAdded;
}

export function getConnectedHoppers(block: Block): Block[] {
  const hoppers: Block[] = [];

  {
    const north = block.north();
    if (
      north?.typeId === "minecraft:hopper" &&
      !north.getRedstonePower() &&
      north.permutation.getState("facing_direction") === 3
    ) {
      hoppers.push(north);
    }
  }

  {
    const east = block.east();
    if (
      east?.typeId === "minecraft:hopper" &&
      !east.getRedstonePower() &&
      east.permutation.getState("facing_direction") === 4
    ) {
      hoppers.push(east);
    }
  }

  {
    const south = block.south();
    if (
      south?.typeId === "minecraft:hopper" &&
      !south.getRedstonePower() &&
      south.permutation.getState("facing_direction") === 2
    ) {
      hoppers.push(south);
    }
  }

  {
    const west = block.west();
    if (
      west?.typeId === "minecraft:hopper" &&
      !west.getRedstonePower() &&
      west.permutation.getState("facing_direction") === 5
    ) {
      hoppers.push(west);
    }
  }

  {
    const above = block.above();
    if (
      above?.typeId === "minecraft:hopper" &&
      !above.getRedstonePower() &&
      above.permutation.getState("facing_direction") === 0
    ) {
      hoppers.push(above);
    }
  }

  return hoppers;
}

export function getFirstSlotWithItem(
  container: Container,
  allowedItems?: string[],
): ContainerSlot | undefined {
  for (let i = 0; i < container.size; i++) {
    const slot = container.getSlot(i);
    if (
      slot.hasItem() &&
      (!allowedItems || allowedItems.includes(slot.typeId))
    ) {
      return slot;
    }
  }
}

export function getFirstSlotWithItemInConnectedHoppers(
  block: Block,
  allowedItems?: string[],
): ContainerSlot | undefined {
  const hoppers = getConnectedHoppers(block);

  for (const hopper of hoppers) {
    const slot = getFirstSlotWithItem(
      getBlockComponent(hopper, "inventory")!.container!,
      allowedItems,
    );
    if (slot) return slot;
  }
}

export class BlockStateAccessor<TValue extends string | number | boolean> {
  private cachedValue: TValue | undefined;

  constructor(
    readonly block: Block,
    readonly stateId: string,
  ) {}

  get(): TValue {
    if (this.cachedValue === undefined) {
      this.cachedValue = this.block.permutation.getState(
        this.stateId,
      ) as TValue;
    }

    return this.cachedValue;
  }

  set(newVal: TValue): void {
    if (this.get() === newVal) return;

    this.cachedValue = newVal;
    this.block.setPermutation(
      this.block.permutation.withState(this.stateId, newVal),
    );
  }
}
