import { removeMachine } from "bedrock-energistics-core-api";
import { ItemStack, Player, world } from "@minecraft/server";

world.afterEvents.entityHitEntity.subscribe((e) => {
  if (!(e.damagingEntity instanceof Player)) return;

  if (e.hitEntity.typeId === "fluffyalien_energistics:item_charger") {
    e.hitEntity.dimension.spawnItem(
      new ItemStack("fluffyalien_energistics:item_charger"),
      e.hitEntity.location,
    );

    const container = e.hitEntity.getComponent("inventory")!.container!;

    const inputItem = container.getItem(4);
    if (inputItem) {
      e.hitEntity.dimension.spawnItem(inputItem, e.hitEntity.location);
    }
  } else {
    return;
  }

  const block = e.hitEntity.dimension.getBlock(e.hitEntity.location);
  if (!block) return;

  void removeMachine(block).then(() => {
    block.setType("air");
  });
  e.hitEntity.remove();
});
