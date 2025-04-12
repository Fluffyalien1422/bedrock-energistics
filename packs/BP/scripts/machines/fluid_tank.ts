import {
  getMachineStorage,
  setMachineStorage,
  StandardStorageType,
} from "bedrock-energistics-core-api";
import {
  genericStorageTypeContainerComponent,
  GenericStorageTypeContainerMachine,
  ST_CONTAINER_MAX_STORAGE,
} from "./shared/generic_storage_type_container";
import {
  Block,
  BlockCustomComponent,
  EquipmentSlot,
  ItemStack,
  Player,
  world,
} from "@minecraft/server";
import { decrementSlotSurvival } from "../utils/item";
import { BlockStateAccessor } from "../utils/block";

const BUCKET_ML = 100;

const ACCEPTED_TYPES: StandardStorageType[] = [
  StandardStorageType.Lava,
  StandardStorageType.Oil,
  StandardStorageType.Water,
];

function bucketInteraction(player: Player, block: Block): void {
  const equippable = player.getComponent("equippable")!;
  const mainHand = equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
  if (!mainHand.hasItem()) return;

  const fluidTypeState = new BlockStateAccessor<string>(
    block,
    "fluffyalien_energistics:type",
  );
  const fluidType = fluidTypeState.get();

  if (mainHand.typeId === "minecraft:bucket") {
    if (fluidType === "water") {
      const stored = getMachineStorage(block, "water");
      if (stored < BUCKET_ML) return;

      void setMachineStorage(block, "water", stored - BUCKET_ML);
      decrementSlotSurvival(player, mainHand);
      player.dimension.spawnItem(
        new ItemStack("water_bucket"),
        player.location,
      );
    } else if (fluidType === "lava") {
      const stored = getMachineStorage(block, "lava");
      if (stored < BUCKET_ML) return;

      void setMachineStorage(block, "lava", stored - BUCKET_ML);
      decrementSlotSurvival(player, mainHand);
      player.dimension.spawnItem(new ItemStack("lava_bucket"), player.location);
    }
  } else if (mainHand.typeId === "minecraft:water_bucket") {
    if (fluidType !== "water" && fluidType !== "none") return;

    const stored = getMachineStorage(block, "water");
    if (stored + BUCKET_ML > ST_CONTAINER_MAX_STORAGE) return;

    void setMachineStorage(block, "water", stored + BUCKET_ML);
    decrementSlotSurvival(player, mainHand);
    player.dimension.spawnItem(new ItemStack("bucket"), player.location);

    if (fluidType === "none") {
      fluidTypeState.set("water");
    }
  } else if (mainHand.typeId === "minecraft:lava_bucket") {
    if (fluidType !== "lava" && fluidType !== "none") return;

    const stored = getMachineStorage(block, "lava");
    if (stored + BUCKET_ML > ST_CONTAINER_MAX_STORAGE) return;

    void setMachineStorage(block, "lava", stored + BUCKET_ML);
    decrementSlotSurvival(player, mainHand);
    player.dimension.spawnItem(new ItemStack("bucket"), player.location);

    if (fluidType === "none") {
      fluidTypeState.set("lava");
    }
  }
}

export const fluidTankMachine = new GenericStorageTypeContainerMachine(
  "fluffyalien_energistics:fluid_tank",
  ACCEPTED_TYPES,
);

export const fluidTankComponent: BlockCustomComponent = {
  ...genericStorageTypeContainerComponent,

  onPlayerInteract(e) {
    bucketInteraction(e.player!, e.block);
  },
};

world.afterEvents.playerInteractWithEntity.subscribe((e) => {
  if (e.target.typeId !== "fluffyalien_energistics:fluid_tank") {
    return;
  }

  const block = e.target.dimension.getBlock(e.target.location);
  if (block) bucketInteraction(e.player, block);
});
