import { removeMachine } from "bedrock-energistics-core-api";
import { Vector3Utils } from "@minecraft/math";
import { ItemStack, Player, world } from "@minecraft/server";

world.afterEvents.entityHitEntity.subscribe((e) => {
  if (!(e.damagingEntity instanceof Player)) return;

  if (e.hitEntity.typeId === "fluffyalien_energistics:powered_furnace") {
    e.hitEntity.dimension.spawnItem(
      new ItemStack("fluffyalien_energistics:powered_furnace"),
      e.hitEntity.location,
    );

    const container = e.hitEntity.getComponent("inventory")!.container!;

    const inputItem = container.getItem(4);
    if (inputItem) {
      e.hitEntity.dimension.spawnItem(inputItem, e.hitEntity.location);
    }

    const outputItem = container.getItem(5);
    if (outputItem) {
      e.hitEntity.dimension.spawnItem(outputItem, e.hitEntity.location);
    }
  } else {
    return;
  }

  const blockLocation = Vector3Utils.floor(e.hitEntity.location);
  const blockDimensionLocation = {
    dimension: e.hitEntity.dimension,
    ...blockLocation,
  };

  removeMachine(blockDimensionLocation);
  e.hitEntity.dimension.setBlockType(blockLocation, "air");
  e.hitEntity.remove();
});
