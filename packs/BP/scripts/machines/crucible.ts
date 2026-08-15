import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
  takeMachineSlotItem,
} from "bedrock-energistics-core-api";
import { blockLocationToUid } from "../utils/location";
import {
  BlockComponentTickEvent,
  BlockCustomComponent,
} from "@minecraft/server";
import { BlockStateAccessor } from "../utils/block";
import { getInputItemWithHopperSupport } from "../utils/item";
import { MAX_MACHINE_STORAGE } from "../constants";
import {
  createProgressArrow,
  createTiledIconElements,
  updateProgressArrow,
} from "../utils/ui";

const ENERGY_CONSUMPTION = 1; // per progress
const LAVA_GENERATION = 32; // on completion
const MAX_PROGRESS = 32;

const PROGRESS_ARROW = createProgressArrow("progress", 9);
const INPUT_ALLOWED_ITEMS = ["minecraft:cobblestone"];

const progressMap = new Map<string, number>();

export const crucibleMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:crucible",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: "energy",
          },
        },
        lavaBar: {
          type: "storageBar",
          startIndex: 4,
          defaults: {
            type: "lava",
          },
        },
        inputSlot: {
          type: "itemSlot",
          index: 8,
          allowedItems: INPUT_ALLOWED_ITEMS,
        },
        // slots 9-10
        ...createTiledIconElements(PROGRESS_ARROW),
      },
    },
  },
  handlers: {
    updateUi(e) {
      const uid = blockLocationToUid(e.blockLocation);

      return {
        progressIndicators: updateProgressArrow(
          PROGRESS_ARROW,
          progressMap.get(uid) ?? 0,
          MAX_PROGRESS,
        ),
      };
    },
  },
};

async function onTickAsync(e: BlockComponentTickEvent): Promise<void> {
  const uid = blockLocationToUid(e.block);
  const workingState = new BlockStateAccessor<boolean>(
    e.block,
    "fluffyalien_energistics:working",
  );
  const inputItem = await getInputItemWithHopperSupport(
    e.block,
    "inputSlot",
    INPUT_ALLOWED_ITEMS,
  );
  if (!inputItem) {
    progressMap.delete(uid);
    workingState.set(false);
    generate(e.block, "lava", 0);
    return;
  }
  const progress = progressMap.get(uid) ?? 0;
  const storedEnergy = getMachineStorage(e.block, "energy");
  const storedLava = getMachineStorage(e.block, "lava");

  if (
    storedEnergy < ENERGY_CONSUMPTION * (MAX_PROGRESS - progress) ||
    storedLava + LAVA_GENERATION > MAX_MACHINE_STORAGE
  ) {
    progressMap.delete(uid);
    workingState.set(false);
    generate(e.block, "lava", 0);
    return;
  }

  if (progress >= MAX_PROGRESS) {
    progressMap.delete(uid);

    // only generate lava if the input was really consumed
    const consumed = await takeMachineSlotItem(e.block, "inputSlot", 1, {
      expectType: inputItem.typeId,
    });

    generate(e.block, "lava", consumed ? LAVA_GENERATION : 0);
    return;
  }

  progressMap.set(uid, progress + 1);
  void setMachineStorage(e.block, "energy", storedEnergy - ENERGY_CONSUMPTION);
  generate(e.block, "lava", 0);

  workingState.set(true);
}

export const crucibleComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
