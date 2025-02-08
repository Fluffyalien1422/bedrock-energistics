import { removeMachine } from "bedrock-energistics-core-api";
import { ItemStack, Player, world } from "@minecraft/server";
import { getEntityComponent } from "./polyfills/component_type_map";

world.afterEvents.entityHitEntity.subscribe((e) => {
  if (!(e.damagingEntity instanceof Player)) return;

  if (e.hitEntity.typeId === "fluffyalien_energistics:powered_furnace") {
    e.hitEntity.dimension.spawnItem(
      new ItemStack("fluffyalien_energistics:powered_furnace"),
      e.hitEntity.location,
    );

    const container = getEntityComponent(e.hitEntity, "inventory")!.container!;

    const inputItem = container.getItem(4);
    if (inputItem) {
      e.hitEntity.dimension.spawnItem(inputItem, e.hitEntity.location);
    }

    const outputItem = container.getItem(5);
    if (outputItem) {
      e.hitEntity.dimension.spawnItem(outputItem, e.hitEntity.location);
    }
  } else if (e.hitEntity.typeId === "fluffyalien_energistics:block_placer") {
    e.hitEntity.dimension.spawnItem(
      new ItemStack("fluffyalien_energistics:block_placer"),
      e.hitEntity.location,
    );

    const container = getEntityComponent(e.hitEntity, "inventory")!.container!;

    const inputItem = container.getItem(4);
    if (inputItem) {
      e.hitEntity.dimension.spawnItem(inputItem, e.hitEntity.location);
    }
  } else if (e.hitEntity.typeId === "fluffyalien_energistics:item_charger") {
    e.hitEntity.dimension.spawnItem(
      new ItemStack("fluffyalien_energistics:item_charger"),
      e.hitEntity.location,
    );

    const container = getEntityComponent(e.hitEntity, "inventory")!.container!;

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
