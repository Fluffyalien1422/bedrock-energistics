import { TUTORIAL_ENTRIES, TutorialEntry } from "./tutorial_book_entries";
import { ItemStack, Player, RawMessage, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const NOT_FIRST_JOIN_DYNAMIC_PROPERTY_ID =
  "fluffyalien_energistics:not_first_join";

const ICON_OVERRIDES: Record<string, string> = {
  conduits: "textures/fluffyalien/energistics/ui/tutorial_book/networks_icon",
  generators: "textures/fluffyalien/energistics/ui/tutorial_book/generic_icon",
  consumers: "textures/fluffyalien/energistics/ui/tutorial_book/generic_icon",
};

function camelCaseToSnakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

export async function showTutorialBookUi(player: Player): Promise<void> {
  const form = new ActionFormData();

  form.title({ translate: "item.fluffyalien_energistics:tutorial_book" });

  for (const entry of TUTORIAL_ENTRIES) {
    form.button(
      {
        translate: `fluffyalien_energistics.ui.tutorialBook.entry.${entry.id}.title`,
      },
      ICON_OVERRIDES[entry.id] ??
        `textures/fluffyalien/energistics/ui/tutorial_book/${camelCaseToSnakeCase(entry.id)}_icon`,
    );
  }

  const response = await form.show(player);
  if (response.selection === undefined) return;

  const entry = TUTORIAL_ENTRIES[response.selection];
  return void showTutorialBookEntryUi(player, entry);
}

async function showTutorialBookEntryUi(
  player: Player,
  entry: TutorialEntry,
): Promise<void> {
  const rawtext: RawMessage[] = [
    { text: "§l§e" },
    {
      translate: `fluffyalien_energistics.ui.tutorialBook.entry.${entry.id}.title`,
    },
  ];

  for (let i = 0; i < entry.bullets; i++) {
    rawtext.push({ text: "\n\n§l§e-§r " });
    rawtext.push({
      translate: `fluffyalien_energistics.ui.tutorialBook.entry.${entry.id}.bullet${i.toString()}`,
    });
  }

  const form = new ActionFormData()
    .title({ translate: "item.fluffyalien_energistics:tutorial_book" })
    .body({ rawtext })
    .button({ translate: "fluffyalien_energistics.ui.common.back" });

  await form.show(player);
  return showTutorialBookUi(player);
}

world.afterEvents.playerSpawn.subscribe((e) => {
  if (
    !e.initialSpawn ||
    e.player.getDynamicProperty(NOT_FIRST_JOIN_DYNAMIC_PROPERTY_ID)
  )
    return;

  e.player.setDynamicProperty(NOT_FIRST_JOIN_DYNAMIC_PROPERTY_ID, true);

  const tutorialBook = new ItemStack("fluffyalien_energistics:tutorial_book");
  e.player.dimension.spawnItem(tutorialBook, e.player.location);
});

world.afterEvents.itemUse.subscribe((e) => {
  if (e.itemStack.typeId !== "fluffyalien_energistics:tutorial_book") return;

  void showTutorialBookUi(e.source);
});
