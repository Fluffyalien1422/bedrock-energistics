import {
  BlockCustomComponent,
  BlockPermutation,
  EquipmentSlot,
  GameMode,
  ItemStack,
} from "@minecraft/server";
import { updateBlockConnectStates } from "./utils/block";
import { STR_DIRECTIONS } from "./utils/direction";
import { decrementSlotSurvival } from "./utils/item";
import { updateMachineConnectableNetworks } from "bedrock-energistics-core-api";

export const energyConduitComponent: BlockCustomComponent = {
  onTick({ block }) {
    updateBlockConnectStates(block, STR_DIRECTIONS, (other) =>
      other.hasTag("fluffyalien_energisticscore:io.energy"),
    );
  },
  onPlayerInteract(e) {
    const player = e.player!;

    const heldSlot = player
      .getComponent("equippable")!
      .getEquipmentSlot(EquipmentSlot.Mainhand);

    switch (heldSlot.typeId) {
      case "fluffyalien_energistics:fluid_conduit":
        e.block.setPermutation(
          BlockPermutation.resolve("fluffyalien_energistics:multi_conduit", {
            "fluffyalien_energistics:energy": true,
            "fluffyalien_energistics:fluid": true,
          }),
        );
        decrementSlotSurvival(player, heldSlot);
        break;
      case "fluffyalien_energistics:gas_conduit":
        e.block.setPermutation(
          BlockPermutation.resolve("fluffyalien_energistics:multi_conduit", {
            "fluffyalien_energistics:energy": true,
            "fluffyalien_energistics:gas": true,
          }),
        );
        decrementSlotSurvival(player, heldSlot);
        break;
    }
  },
};

export const fluidConduitComponent: BlockCustomComponent = {
  onTick({ block }) {
    updateBlockConnectStates(block, STR_DIRECTIONS, (other) =>
      other.hasTag("fluffyalien_energisticscore:io.fluid"),
    );
  },
  onPlayerInteract(e) {
    const player = e.player!;

    const heldSlot = player
      .getComponent("equippable")!
      .getEquipmentSlot(EquipmentSlot.Mainhand);

    switch (heldSlot.typeId) {
      case "fluffyalien_energistics:energy_conduit":
        e.block.setPermutation(
          BlockPermutation.resolve("fluffyalien_energistics:multi_conduit", {
            "fluffyalien_energistics:fluid": true,
            "fluffyalien_energistics:energy": true,
          }),
        );
        decrementSlotSurvival(player, heldSlot);
        break;
      case "fluffyalien_energistics:gas_conduit":
        e.block.setPermutation(
          BlockPermutation.resolve("fluffyalien_energistics:multi_conduit", {
            "fluffyalien_energistics:fluid": true,
            "fluffyalien_energistics:gas": true,
          }),
        );
        decrementSlotSurvival(player, heldSlot);
        break;
    }
  },
};

export const gasConduitComponent: BlockCustomComponent = {
  onTick({ block }) {
    updateBlockConnectStates(block, STR_DIRECTIONS, (other) =>
      other.hasTag("fluffyalien_energisticscore:io.gas"),
    );
  },
  onPlayerInteract(e) {
    const player = e.player!;

    const heldSlot = player
      .getComponent("equippable")!
      .getEquipmentSlot(EquipmentSlot.Mainhand);

    switch (heldSlot.typeId) {
      case "fluffyalien_energistics:fluid_conduit":
        e.block.setPermutation(
          BlockPermutation.resolve("fluffyalien_energistics:multi_conduit", {
            "fluffyalien_energistics:gas": true,
            "fluffyalien_energistics:fluid": true,
          }),
        );
        decrementSlotSurvival(player, heldSlot);
        break;
      case "fluffyalien_energistics:energy_conduit":
        e.block.setPermutation(
          BlockPermutation.resolve("fluffyalien_energistics:multi_conduit", {
            "fluffyalien_energistics:gas": true,
            "fluffyalien_energistics:energy": true,
          }),
        );
        decrementSlotSurvival(player, heldSlot);
        break;
    }
  },
};

export const multiConduitComponent: BlockCustomComponent = {
  onTick({ block }) {
    const hasEnergyIo = block.hasTag("fluffyalien_energisticscore:io.energy");
    const hasFluidIo = block.hasTag("fluffyalien_energisticscore:io.fluid");
    const hasGasIo = block.hasTag("fluffyalien_energisticscore:io.gas");
    updateBlockConnectStates(block, STR_DIRECTIONS, (other) => {
      const otherHasEnergyIo = other.hasTag(
        "fluffyalien_energisticscore:io.energy",
      );
      const otherHasFluidIo = other.hasTag(
        "fluffyalien_energisticscore:io.fluid",
      );
      const otherHasGasIo = other.hasTag("fluffyalien_energisticscore:io.gas");

      const matchAny =
        (hasEnergyIo && otherHasEnergyIo) ||
        (hasFluidIo && otherHasFluidIo) ||
        (hasGasIo && otherHasGasIo);

      if (!matchAny) {
        return "none";
      }

      if (other.typeId === "fluffyalien_energistics:multi_conduit") {
        const matchExact =
          hasEnergyIo === otherHasEnergyIo &&
          hasFluidIo === otherHasFluidIo &&
          hasGasIo === otherHasGasIo;

        return matchExact ? "connect" : "border";
      }

      return "border";
    });
  },
  onPlayerInteract(e) {
    const player = e.player!;

    const heldSlot = player
      .getComponent("equippable")!
      .getEquipmentSlot(EquipmentSlot.Mainhand);

    switch (heldSlot.typeId) {
      case "fluffyalien_energistics:energy_conduit":
        if (e.block.permutation.getState("fluffyalien_energistics:energy")) {
          break;
        }

        e.block.setPermutation(
          e.block.permutation.withState("fluffyalien_energistics:energy", true),
        );
        updateMachineConnectableNetworks(e.block);
        decrementSlotSurvival(player, heldSlot);
        break;
      case "fluffyalien_energistics:fluid_conduit":
        if (e.block.permutation.getState("fluffyalien_energistics:fluid")) {
          break;
        }

        e.block.setPermutation(
          e.block.permutation.withState("fluffyalien_energistics:fluid", true),
        );
        updateMachineConnectableNetworks(e.block);
        decrementSlotSurvival(player, heldSlot);
        break;
      case "fluffyalien_energistics:gas_conduit":
        if (e.block.permutation.getState("fluffyalien_energistics:gas")) {
          break;
        }

        e.block.setPermutation(
          e.block.permutation.withState("fluffyalien_energistics:gas", true),
        );
        updateMachineConnectableNetworks(e.block);
        decrementSlotSurvival(player, heldSlot);
        break;
    }
  },
  onPlayerDestroy(e) {
    if (e.player!.getGameMode() === GameMode.creative) {
      return;
    }

    const center = e.block.center();

    if (
      e.destroyedBlockPermutation.getState("fluffyalien_energistics:energy")
    ) {
      e.dimension.spawnItem(
        new ItemStack("fluffyalien_energistics:energy_conduit"),
        center,
      );
    }

    if (e.destroyedBlockPermutation.getState("fluffyalien_energistics:fluid")) {
      e.dimension.spawnItem(
        new ItemStack("fluffyalien_energistics:fluid_conduit"),
        center,
      );
    }

    if (e.destroyedBlockPermutation.getState("fluffyalien_energistics:gas")) {
      e.dimension.spawnItem(
        new ItemStack("fluffyalien_energistics:gas_conduit"),
        center,
      );
    }
  },
};
