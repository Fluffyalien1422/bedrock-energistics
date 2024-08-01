import { Block } from "@minecraft/server";
import { getBlockInDirection, StrDirection } from "./direction";

/**
 * sets the connect states of a block (eg. `fluffyalien_energistics:north`) to a value returned by a callback function
 */
export function updateBlockConnectStates<TDirection extends StrDirection>(
  block: Block,
  directions: readonly TDirection[],
  callback: (block: Block, direction: TDirection) => string | number | boolean,
): void {
  let permutation = block.permutation;
  let anyStatesChanged = false;

  for (const direction of directions) {
    const blockInDirection = getBlockInDirection(block, direction);
    if (!blockInDirection) {
      continue;
    }

    const stateName = `fluffyalien_energistics:${direction}`;
    const newValue = callback(blockInDirection, direction);

    if (permutation.getState(stateName) !== newValue) {
      permutation = permutation.withState(stateName, newValue);
      anyStatesChanged = true;
    }
  }

  if (anyStatesChanged) {
    block.setPermutation(permutation);
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
