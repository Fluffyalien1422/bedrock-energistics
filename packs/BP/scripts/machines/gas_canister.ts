import { BlockCustomComponent } from "@minecraft/server";
import {
  generate,
  getMachineStorage,
  MachineDefinition,
} from "bedrock-energistics-core-api";
import { BlockStateAccessor } from "../utils/block";

const AMOUNT_PER_STAGE = 2500;
const MAX_STORAGE = AMOUNT_PER_STAGE * 3;

const ACCEPTED_TYPES = ["ammonia", "carbon", "hydrogen", "nitrogen", "oxygen"];

export const gasCanisterMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:gas_canister",
    maxStorage: MAX_STORAGE,
    ui: {
      elements: {
        storageBar: {
          type: "storageBar",
          startIndex: 0,
        },
      },
    },
  },
  handlers: {
    updateUi(e) {
      const block = e.blockLocation.dimension.getBlock(e.blockLocation);
      const type = block?.permutation.getState(
        "fluffyalien_energistics:type",
      ) as string | undefined;

      if (!type || type === "none") return {};

      return {
        storageBars: {
          storageBar: {
            type,
          },
        },
      };
    },
    receive(e) {
      if (!ACCEPTED_TYPES.includes(e.receiveType)) return 0;

      const block = e.blockLocation.dimension.getBlock(e.blockLocation);
      if (!block) return 0;

      const typeState = new BlockStateAccessor<string>(
        block,
        "fluffyalien_energistics:type",
      );

      const type = typeState.get();

      if (type === "none") {
        typeState.set(e.receiveType);
        return undefined;
      }

      if (type !== e.receiveType) return 0;
    },
  },
};

export const gasCanisterComponent: BlockCustomComponent = {
  onTick(e) {
    const type = e.block.permutation.getState(
      "fluffyalien_energistics:type",
    ) as string;

    if (type === "none") return;

    const stageState = new BlockStateAccessor<number>(
      e.block,
      "fluffyalien_energistics:stage",
    );

    const stored = getMachineStorage(e.block, type);

    if (stored <= 0) {
      stageState.set(0);
    } else {
      stageState.set(Math.max(Math.floor(stored / AMOUNT_PER_STAGE), 1));
    }

    generate(e.block, type, 0);
  },
};
