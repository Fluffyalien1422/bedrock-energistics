import { Block } from "@minecraft/server";
import { getBlockInDirection, StrDirection } from "./direction";

/**
 * sets the connect states of a block (eg. `fluffyalien_energistics:north`) to a boolean value
 */
export function updateBlockConnectStates<TDirection extends StrDirection>(
  block: Block,
  directions: readonly TDirection[],
  condition: (block: Block, direction: TDirection) => boolean,
): void {
  let permutation = block.permutation;
  let anyStatesChanged = false;

  for (const direction of directions) {
    const blockInDirection = getBlockInDirection(block, direction);
    if (!blockInDirection) {
      continue;
    }

    const stateName = `fluffyalien_energistics:${direction}`;
    const newValue = condition(blockInDirection, direction);

    if (permutation.getState(stateName) !== newValue) {
      permutation = permutation.withState(stateName, newValue);
      anyStatesChanged = true;
    }
  }

  if (anyStatesChanged) {
    block.setPermutation(permutation);
  }
}
