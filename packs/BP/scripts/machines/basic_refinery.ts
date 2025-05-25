import {
  getMachineStorage,
  MachineDefinition,
  MachineItemStack,
  MachineNetwork,
  RegisteredStorageType,
  setMachineSlotItem,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { blockLocationToUid } from "../utils/location";
import {
  BlockComponentTickEvent,
  BlockCustomComponent,
  ItemStack,
  Player,
  RawMessage,
  system,
  world,
} from "@minecraft/server";
import { BlockStateAccessor } from "../utils/block";
import {
  decrementMachineSlot,
  getInputItemWithHopperSupport,
  getItemTranslationKey,
  getOutputItemWithHopperSupport,
} from "../utils/item";
import { BlockStateSuperset } from "@minecraft/vanilla-data";
import { ModalFormData } from "@minecraft/server-ui";

const ENERGY_CONSUMPTION = 5;

interface RecipeItem {
  type: string;
  amount: number;
  name?: RawMessage;
}

interface RecipeDefinition {
  maxProgress: number;
  fluidInput?: RecipeItem;
  itemInput?: RecipeItem;
  itemOutput: RecipeItem;
}

const RECIPE_IDS = ["coal", "plastic"] as const;
type RecipeId = (typeof RECIPE_IDS)[number];
type RecipeStateValue = RecipeId | "none";

const RECIPES: Record<RecipeId, RecipeDefinition> = {
  coal: {
    maxProgress: 16,
    fluidInput: {
      type: "carbon",
      amount: 1000,
    },
    itemOutput: {
      type: "minecraft:coal",
      amount: 1,
    },
  },
  plastic: {
    maxProgress: 32,
    fluidInput: {
      type: "oil",
      amount: 1000,
    },
    itemInput: {
      type: "minecraft:coal",
      amount: 1,
    },
    itemOutput: {
      type: "fluffyalien_energistics:plastic",
      amount: 1,
    },
  },
};

const progressMap = new Map<string, number>();

export const basicRefineryMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:basic_refinery",
    ui: {
      elements: {
        optionsBtn: {
          type: "button",
          index: 0,
          defaults: {
            itemId: "fluffyalien_energistics:ui_options_button",
          },
        },
        energyBar: {
          type: "storageBar",
          startIndex: 1,
          defaults: {
            type: "energy",
          },
        },
        fluidInput: {
          type: "storageBar",
          startIndex: 5,
        },
        progressIndicator: {
          type: "progressIndicator",
          indicator: "arrow",
          index: 11,
        },
        inputSlot: {
          type: "itemSlot",
          index: 9,
        },
        outputSlot: {
          type: "itemSlot",
          index: 10,
        },
      },
    },
  },
  handlers: {
    updateUi(e) {
      const uid = blockLocationToUid(e.blockLocation);
      const block = e.blockLocation.dimension.getBlock(e.blockLocation)!;
      const recipeId = block.permutation.getState(
        "fluffyalien_energistics:recipe" as keyof BlockStateSuperset,
      ) as RecipeStateValue;
      if (recipeId === "none") return {};
      const recipe = RECIPES[recipeId];

      return {
        storageBars: {
          fluidInput: {
            type: recipe.fluidInput?.type,
          },
        },
        progressIndicators: {
          progressIndicator: Math.floor(
            ((progressMap.get(uid) ?? 0) / recipe.maxProgress) * 16,
          ),
        },
      };
    },
  },
  events: {
    async onButtonPressed(e) {
      const block = e.blockLocation.dimension.getBlock(e.blockLocation);
      if (!block) return;

      world.getEntity(e.entityId)?.remove();

      await system.waitTicks(4);

      const recipeId = block.permutation.getState(
        "fluffyalien_energistics:recipe" as keyof BlockStateSuperset,
      ) as RecipeStateValue;

      const currentIndex =
        recipeId === "none" ? 0 : RECIPE_IDS.indexOf(recipeId);

      const description: RawMessage[] = [];
      const recipeNames: RawMessage[] = [];
      for (const id of RECIPE_IDS) {
        const recipe = RECIPES[id];

        const itemOutputMsg = recipe.itemOutput.name ?? {
          translate: getItemTranslationKey(recipe.itemOutput.type),
        };
        recipeNames.push(itemOutputMsg);

        description.push({ text: "§r§l" }, itemOutputMsg, { text: "§r§s\n" });
        if (recipe.fluidInput) {
          description.push(
            recipe.fluidInput.name ?? {
              text: (await RegisteredStorageType.get(recipe.fluidInput.type))
                ?.name,
            },
            { text: ` §r(${recipe.fluidInput.amount.toString()}u)` },
          );
          if (recipe.itemInput) {
            description.push({ text: "§u + §s" });
          }
        }
        if (recipe.itemInput) {
          description.push(
            recipe.itemInput.name ?? {
              translate: getItemTranslationKey(recipe.itemInput.type),
            },
            { text: ` §r(${recipe.itemInput.amount.toString()}x)` },
          );
        }
        description.push({ text: "§u -> §s" }, itemOutputMsg, {
          text: ` §r(${recipe.itemOutput.amount.toString()}x)\n\n`,
        });
      }

      const form = new ModalFormData()
        .title({
          translate: "tile.fluffyalien_energistics:basic_refinery.name",
        })
        .dropdown(
          {
            rawtext: [
              ...description,
              {
                translate:
                  "fluffyalien_energistics.ui.basicRefinery.options.recipe",
              },
            ],
          },
          recipeNames,
          currentIndex,
        );

      const player = world.getEntity(e.playerId) as Player;

      const response = await form.show(player);
      if (!response.formValues) return;

      const selectedIndex = response.formValues[0] as number;

      const newValue = RECIPE_IDS[selectedIndex];
      if (recipeId === newValue) return;

      block.setPermutation(
        block.permutation.withState(
          "fluffyalien_energistics:recipe" as keyof BlockStateSuperset,
          newValue,
        ),
      );

      await system.waitTicks(1);

      void MachineNetwork.updateWithBlock(block);
      void MachineNetwork.updateAdjacent(block);
    },
  },
};

async function onTickAsync(e: BlockComponentTickEvent): Promise<void> {
  const uid = blockLocationToUid(e.block);

  const workingState = new BlockStateAccessor<boolean>(
    e.block,
    "fluffyalien_energistics:working",
  );

  const outputItem = await getOutputItemWithHopperSupport(
    e.block,
    "outputSlot",
  );
  const inputItem = await getInputItemWithHopperSupport(e.block, "inputSlot");

  const recipeId = e.block.permutation.getState(
    "fluffyalien_energistics:recipe" as keyof BlockStateSuperset,
  ) as RecipeStateValue;
  if (recipeId === "none") {
    progressMap.delete(uid);
    workingState.set(false);
    return;
  }

  const recipe = RECIPES[recipeId];
  const resultItemStack = new ItemStack(
    recipe.itemOutput.type,
    recipe.itemOutput.amount,
  );

  // verify output
  if (outputItem) {
    const outputItemStack = outputItem.toItemStack();
    if (
      !outputItemStack.isStackableWith(resultItemStack) ||
      outputItem.amount + recipe.itemOutput.amount >= outputItemStack.maxAmount
    ) {
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }
  }

  // verify inputs
  if (recipe.itemInput?.type !== inputItem?.typeId) {
    progressMap.delete(uid);
    workingState.set(false);
    return;
  }

  if (recipe.fluidInput) {
    const fluidInputAmount = getMachineStorage(e.block, recipe.fluidInput.type);
    if (fluidInputAmount < recipe.fluidInput.amount) {
      progressMap.delete(uid);
      workingState.set(false);
      return;
    }
  }

  // progress

  const progress = progressMap.get(uid) ?? 0;
  const storedEnergy = getMachineStorage(e.block, "energy");

  if (storedEnergy < ENERGY_CONSUMPTION * (recipe.maxProgress - progress)) {
    progressMap.delete(uid);
    workingState.set(false);
    return;
  }

  if (progress >= recipe.maxProgress) {
    if (inputItem) {
      decrementMachineSlot(e.block, "inputSlot", inputItem);
    }

    if (recipe.fluidInput) {
      void setMachineStorage(
        e.block,
        recipe.fluidInput.type,
        getMachineStorage(e.block, recipe.fluidInput.type) -
          recipe.fluidInput.amount,
      );
    }

    if (outputItem) {
      outputItem.amount += recipe.itemOutput.amount;
      setMachineSlotItem(e.block, "outputSlot", outputItem);
    } else {
      setMachineSlotItem(
        e.block,
        "outputSlot",
        new MachineItemStack(recipe.itemOutput.type, recipe.itemOutput.amount),
      );
    }

    progressMap.delete(uid);
    return;
  }

  progressMap.set(uid, progress + 1);
  void setMachineStorage(e.block, "energy", storedEnergy - ENERGY_CONSUMPTION);

  workingState.set(true);
}

export const basicRefineryComponent: BlockCustomComponent = {
  onTick(e) {
    void onTickAsync(e);
  },
};
