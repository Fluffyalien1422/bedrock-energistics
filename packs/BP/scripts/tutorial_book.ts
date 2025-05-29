import { TUTORIAL_ENTRIES } from "./tutorial_book_entries";
import {
  ItemStack,
  Player,
  RawMessage,
  system,
  world,
} from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const NOT_FIRST_JOIN_DYNAMIC_PROPERTY_ID =
  "fluffyalien_energistics:not_first_join";

const ICON_OVERRIDES: Record<string, string> = {
  conduits: "textures/fluffyalien/energistics/ui/tutorial_book/networks_icon",
  generators: "textures/fluffyalien/energistics/ui/tutorial_book/generic_icon",
  consumers: "textures/fluffyalien/energistics/ui/tutorial_book/generic_icon",
};

const INTERACTION_ENTRY_OVERRIDES: Record<string, string> = {
  fluid_conduit: "conduits",
  gas_conduit: "conduits",
  energy_conduit: "conduits",
  multi_conduit: "conduits",
};

const ENTRY_IDS = Object.keys(TUTORIAL_ENTRIES);

function camelCaseToSnakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function snakeCaseToCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_match, letter: string) =>
    letter.toUpperCase(),
  );
}

async function showTutorialBookUi(player: Player): Promise<void> {
  const form = new ActionFormData();

  form.title({ translate: "fluffyalien_energistics.tutorialBook.item.name" });

  for (const id of ENTRY_IDS) {
    form.button(
      {
        translate: `fluffyalien_energistics.ui.tutorialBook.entry.${id}.title`,
      },
      ICON_OVERRIDES[id] ??
        `textures/fluffyalien/energistics/ui/tutorial_book/${camelCaseToSnakeCase(id)}_icon`,
    );
  }

  const response = await form.show(player);
  if (response.selection === undefined) return;

  const entryId = ENTRY_IDS[response.selection];
  return void showTutorialBookEntryUi(player, entryId);
}

async function showTutorialBookEntryUi(
  player: Player,
  entryId: string,
): Promise<void> {
  const entry = TUTORIAL_ENTRIES[entryId];

  const rawtext: RawMessage[] = [
    { text: "§l§e" },
    {
      translate: `fluffyalien_energistics.ui.tutorialBook.entry.${entryId}.title`,
    },
  ];

  for (let i = 0; i < entry.bullets; i++) {
    rawtext.push({ text: "\n\n§l§e-§r " });
    rawtext.push({
      translate: `fluffyalien_energistics.ui.tutorialBook.entry.${entryId}.bullet${i.toString()}`,
    });
  }

  const form = new ActionFormData()
    .title({ translate: "fluffyalien_energistics.tutorialBook.item.name" })
    .body({ rawtext })
    .button({ translate: "fluffyalien_energistics.ui.common.back" });

  const response = await form.show(player);
  if (!response.canceled) return showTutorialBookUi(player);
}

world.afterEvents.playerSpawn.subscribe((e) => {
  if (
    !e.initialSpawn ||
    e.player.getDynamicProperty(NOT_FIRST_JOIN_DYNAMIC_PROPERTY_ID)
  ) {
    return;
  }

  e.player.setDynamicProperty(NOT_FIRST_JOIN_DYNAMIC_PROPERTY_ID, true);

  const tutorialBook = new ItemStack("fluffyalien_energistics:tutorial_book");
  e.player.dimension.spawnItem(tutorialBook, e.player.location);
});

world.afterEvents.playerInteractWithBlock.subscribe((e) => {
  if (
    e.itemStack?.typeId !== "fluffyalien_energistics:tutorial_book" ||
    !e.block.typeId.startsWith("fluffyalien_energistics:")
  ) {
    return;
  }

  const shortId = e.block.typeId.slice("fluffyalien_energistics:".length);
  const entryId =
    INTERACTION_ENTRY_OVERRIDES[shortId] ?? snakeCaseToCamelCase(shortId);
  if (entryId in TUTORIAL_ENTRIES) {
    void showTutorialBookEntryUi(e.player, entryId);
  }
});

world.beforeEvents.playerInteractWithEntity.subscribe((e) => {
  if (
    e.itemStack?.typeId !== "fluffyalien_energistics:tutorial_book" ||
    !e.target.typeId.startsWith("fluffyalien_energistics:")
  ) {
    return;
  }

  const shortId = e.target.typeId.slice("fluffyalien_energistics:".length);
  const entryId =
    INTERACTION_ENTRY_OVERRIDES[shortId] ?? snakeCaseToCamelCase(shortId);
  if (entryId in TUTORIAL_ENTRIES) {
    e.cancel = true;
    system.run(() => {
      void showTutorialBookEntryUi(e.player, entryId);
    });
  }
});

world.afterEvents.itemUse.subscribe((e) => {
  if (e.itemStack.typeId !== "fluffyalien_energistics:tutorial_book") return;
  void showTutorialBookUi(e.source);
});
