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
  MachineOnButtonPressedEventArg,
  MachineRecieveHandlerArg,
  STANDARD_STORAGE_TYPE_DEFINITIONS,
  StandardStorageType,
  UpdateUiHandlerResponse,
} from "bedrock-energistics-core-api";
import { ModalFormData } from "@minecraft/server-ui";

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
      receive: this.receive.bind(this),
    };
  }

  get events(): MachineDefinitionEvents {
    return {
      onButtonPressed: (e): void => {
        void this.onButtonPressed(e);
      },
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
    if (!(this.acceptedTypes as string[]).includes(e.receiveType)) return 0;

    const block = e.blockLocation.dimension.getBlock(e.blockLocation);
    if (!block) return 0;

    const typeState = new BlockStateAccessor<string>(
      block,
      "fluffyalien_energistics:type",
    );

    const type = typeState.get();

    if (type === "none") {
      typeState.set(e.receiveType);
      return;
    }

    if (type !== e.receiveType) return 0;
  }

  async onButtonPressed(e: MachineOnButtonPressedEventArg): Promise<void> {
    const block = e.blockLocation.dimension.getBlock(e.blockLocation);
    if (!block) return;

    world.getEntity(e.entityId)?.remove();

    await system.waitTicks(4);

    const typeState = new BlockStateAccessor<StandardStorageType | "none">(
      block,
      "fluffyalien_energistics:type",
    );

    const type = typeState.get();

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

    typeState.set(this.acceptedTypes[selectedIndex]);
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
