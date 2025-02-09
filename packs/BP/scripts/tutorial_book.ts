import { ItemStack, Player, RawMessage, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const NOT_FIRST_JOIN_DYNAMIC_PROPERTY_ID =
  "fluffyalien_energistics:not_first_join";

interface TutorialEntry {
  id: string;
  icon: string;
  bullets: number;
}

const TUTORIAL_ENTRIES: TutorialEntry[] = [
  {
    id: "networks",
    bullets: 3,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/networks_icon",
  },
  {
    id: "conduits",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/networks_icon",
  },
  {
    id: "generators",
    bullets: 5,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/generic_icon",
  },
  {
    id: "consumers",
    bullets: 3,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/generic_icon",
  },
  {
    id: "ammoniaFactory",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/ammonia_factory_icon",
  },
  {
    id: "ammoniaGenerator",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/ammonia_generator_icon",
  },
  {
    id: "atmosphericCondenser",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/atmospheric_condenser_icon",
  },
  {
    id: "battery",
    bullets: 1,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/battery_icon",
  },
  {
    id: "blockBreaker",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/block_breaker_icon",
  },
  {
    id: "blockPlacer",
    bullets: 3,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/block_placer_icon",
  },
  {
    id: "centrifuge",
    bullets: 3,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/centrifuge_icon",
  },
  {
    id: "coalGenerator",
    bullets: 3,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/coal_generator_icon",
  },
  {
    id: "crusher",
    bullets: 3,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/crusher_icon",
  },
  {
    id: "disposalUnit",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/disposal_unit_icon",
  },
  {
    id: "fluidSeparator",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/fluid_separator_icon",
  },
  {
    id: "fluidTank",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/fluid_tank_icon",
  },
  {
    id: "gasCanister",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/gas_canister_icon",
  },
  {
    id: "itemCharger",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/item_charger_icon",
  },
  {
    id: "oilExtractor",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/oil_extractor_icon",
  },
  {
    id: "oilGenerator",
    bullets: 1,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/oil_generator_icon",
  },
  {
    id: "organicGenerator",
    bullets: 3,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/organic_generator_icon",
  },
  {
    id: "solarPanel",
    bullets: 4,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/solar_panel_icon",
  },
  {
    id: "poweredFurnace",
    bullets: 3,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/powered_furnace_icon",
  },
  {
    id: "pump",
    bullets: 2,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/pump_icon",
  },
  {
    id: "tesseract",
    bullets: 1,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/tesseract_icon",
  },
  {
    id: "voidMiner",
    bullets: 3,
    icon: "textures/fluffyalien/energistics/ui/tutorial_book/void_miner_icon",
  },
];

export async function showTutorialBookUi(player: Player): Promise<void> {
  const form = new ActionFormData();

  form.title({ translate: "item.fluffyalien_energistics:tutorial_book" });

  for (const entry of TUTORIAL_ENTRIES) {
    form.button(
      {
        translate: `fluffyalien_energistics.ui.tutorialBook.entry.${entry.id}.title`,
      },
      entry.icon,
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
