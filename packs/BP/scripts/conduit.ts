import { BlockCustomComponent } from "@minecraft/server";
import { updateBlockConnectStates } from "./utils/block_connect";
import { STR_DIRECTIONS } from "./utils/direction";

export const conduitComponent: BlockCustomComponent = {
  onTick({ block }) {
    updateBlockConnectStates(block, STR_DIRECTIONS, (other) =>
      other.hasTag("fluffyalien_energisticscore:io.energy"),
    );
  },
};
