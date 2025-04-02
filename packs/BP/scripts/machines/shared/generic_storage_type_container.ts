import { BlockCustomComponent, Player, system, world } from "@minecraft/server";
import { BlockStateAccessor } from "../../utils/block";
import {
  generate,
  getMachineStorage,
  MachineCallbackArg,
  MachineDefinition,
  MachineDefinitionDescription,
  MachineDefinitionEvents,
  MachineDefinitionHandlers,
  MachineNetwork,
  MachineOnButtonPressedEventArg,
  MachineUpdateUiHandlerResponse,
  STANDARD_STORAGE_TYPE_DEFINITIONS,
  StandardStorageType,
} from "bedrock-energistics-core-api";
import { ModalFormData } from "@minecraft/server-ui";
import { BlockStateSuperset } from "@minecraft/vanilla-data";

const AMOUNT_PER_STAGE = 2500;
const MAX_STORAGE = AMOUNT_PER_STAGE * 3;
const STAGE_AMOUNT_PADDING = 200;

export class GenericStorageTypeContainerMachine implements MachineDefinition {
  constructor(
    readonly id: string,
    readonly acceptedTypes: StandardStorageType[],
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
          optionsButton: {
            type: "button",
            index: 4,
            defaults: {
              itemId: "fluffyalien_energistics:ui_options_button",
            },
          },
        },
      },
    };
  }

  get handlers(): MachineDefinitionHandlers {
    return {
      updateUi: this.updateUi.bind(this),
    };
  }

  get events(): MachineDefinitionEvents {
    return {
      onButtonPressed: (e): void => {
        void this.onButtonPressed(e);
      },
    };
  }

  updateUi(e: MachineCallbackArg): MachineUpdateUiHandlerResponse {
    const block = e.blockLocation.dimension.getBlock(e.blockLocation);
    const type = block?.permutation.getState(
      "fluffyalien_energistics:type" as keyof BlockStateSuperset,
    ) as string | undefined;

    if (!type || type === "none") return {};

    return {
      storageBars: {
        storageBar: {
          type,
        },
      },
    };
  }

  async onButtonPressed(e: MachineOnButtonPressedEventArg): Promise<void> {
    const block = e.blockLocation.dimension.getBlock(e.blockLocation);
    if (!block) return;

    world.getEntity(e.entityId)?.remove();

    await system.waitTicks(4);

    const type = block.permutation.getState(
      "fluffyalien_energistics:type" as keyof BlockStateSuperset,
    ) as StandardStorageType | "none";

    const currentIndex = type === "none" ? 0 : this.acceptedTypes.indexOf(type);

    const form = new ModalFormData()
      .title({
        translate: `tile.${this.id}.name`,
      })
      .dropdown(
        {
          translate:
            "fluffyalien_energistics.ui.genericStorageTypeContainer.options.type",
        },
        this.acceptedTypes.map(
          (acceptedType) =>
            STANDARD_STORAGE_TYPE_DEFINITIONS[acceptedType].name,
        ),
        currentIndex,
      );

    const player = world.getEntity(e.playerId) as Player;

    const response = await form.show(player);
    if (!response.formValues) return;

    const selectedIndex = response.formValues[0] as number;

    const newValue = this.acceptedTypes[selectedIndex];
    if (type === newValue) return;

    block.setPermutation(
      block.permutation.withState(
        "fluffyalien_energistics:type" as keyof BlockStateSuperset,
        newValue,
      ),
    );

    await system.waitTicks(1);

    void MachineNetwork.updateWithBlock(block);
    void MachineNetwork.updateAdjacent(block);
  }
}

export const genericStorageTypeContainerComponent: BlockCustomComponent = {
  onTick(e) {
    const type = e.block.permutation.getState(
      "fluffyalien_energistics:type" as keyof BlockStateSuperset,
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
