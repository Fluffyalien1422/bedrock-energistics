import { BlockCustomComponent } from "@minecraft/server";
import { BlockStateAccessor } from "../../utils/block";
import {
  generate,
  getMachineStorage,
  MachineCallbackArg,
  MachineDefinition,
  MachineDefinitionDescription,
  MachineDefinitionHandlers,
  MachineRecieveHandlerArg,
  UpdateUiHandlerResponse,
} from "bedrock-energistics-core-api";

const AMOUNT_PER_STAGE = 2500;
const MAX_STORAGE = AMOUNT_PER_STAGE * 3;
const STAGE_AMOUNT_PADDING = 200;

export class GenericStorageTypeContainerMachine implements MachineDefinition {
  constructor(
    readonly id: string,
    readonly acceptedTypes: string[],
  ) {}

  get description(): MachineDefinitionDescription {
    return {
      id: this.id,
      maxStorage: MAX_STORAGE,
      ui: {
        elements: {
          storageBar: {
            type: "storageBar",
            startIndex: 0,
          },
        },
      },
    };
  }

  get handlers(): MachineDefinitionHandlers {
    return {
      updateUi: this.updateUi.bind(this),
      receive: this.receive.bind(this),
    };
  }

  updateUi(e: MachineCallbackArg): UpdateUiHandlerResponse {
    const block = e.blockLocation.dimension.getBlock(e.blockLocation);
    const type = block?.permutation.getState("fluffyalien_energistics:type") as
      | string
      | undefined;

    if (!type || type === "none") return {};

    return {
      storageBars: {
        storageBar: {
          type,
        },
      },
    };
  }

  receive(e: MachineRecieveHandlerArg): number | undefined {
    if (!this.acceptedTypes.includes(e.receiveType)) return 0;

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
  }
}

export const genericStorageTypeContainerComponent: BlockCustomComponent = {
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
      stageState.set(
        Math.max(
          Math.floor((stored + STAGE_AMOUNT_PADDING) / AMOUNT_PER_STAGE),
          1,
        ),
      );
    }

    generate(e.block, type, 0);
  },
};
