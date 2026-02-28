import { Player, world } from "@minecraft/server";

world.afterEvents.entityHitEntity.subscribe((e) => {
  if (!(e.damagingEntity instanceof Player)) return;

  if (e.hitEntity.typeId === "fluffyalien_energistics:item_charger") {
    const container = e.hitEntity.getComponent("inventory")!.container;

    const inputItem = container.getItem(4);
    if (inputItem) {
      e.hitEntity.dimension.spawnItem(inputItem, e.hitEntity.location);
    }
  } else {
    return;
  }

  const block = e.hitEntity.dimension.getBlock(e.hitEntity.location);
  if (!block) return;

  e.hitEntity.remove();
  block.dimension.runCommand(
    `setblock ${block.x.toString()} ${block.y.toString()} ${block.z.toString()} air destroy`,
  );
});
