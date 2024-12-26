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
import { getEntityComponent } from "./polyfills/component_type_map";
import { MachineIo, MachineNetwork } from "bedrock-energistics-core-api";
import { arraySomeAsync } from "./utils/async";

export const energyConduitComponent: BlockCustomComponent = {
  onTick({ block }) {
    void updateBlockConnectStates(block, STR_DIRECTIONS, (other) =>
      MachineIo.fromMachine(other).acceptsAnyTypeOfCategory("energy"),
    );
  },
  onPlayerInteract(e) {
    const player = e.player!;

    const heldSlot = getEntityComponent(player, "equippable")!.getEquipmentSlot(
      EquipmentSlot.Mainhand,
    );

    if (!heldSlot.hasItem()) return;

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
    void updateBlockConnectStates(block, STR_DIRECTIONS, (other) =>
      MachineIo.fromMachine(other).acceptsAnyTypeOfCategory("fluid"),
    );
  },
  onPlayerInteract(e) {
    const player = e.player!;

    const heldSlot = getEntityComponent(player, "equippable")!.getEquipmentSlot(
      EquipmentSlot.Mainhand,
    );

    if (!heldSlot.hasItem()) return;

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
    void updateBlockConnectStates(block, STR_DIRECTIONS, (other) =>
      MachineIo.fromMachine(other).acceptsAnyTypeOfCategory("gas"),
    );
  },
  onPlayerInteract(e) {
    const player = e.player!;

    const heldSlot = getEntityComponent(player, "equippable")!.getEquipmentSlot(
      EquipmentSlot.Mainhand,
    );

    if (!heldSlot.hasItem()) return;

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
    const io = MachineIo.fromMachine(block);
    void updateBlockConnectStates(block, STR_DIRECTIONS, async (other) => {
      const otherIo = MachineIo.fromMachine(other);

      if (other.typeId === "fluffyalien_energistics:multi_conduit") {
        const matchExact =
          (io.acceptsCategory("energy") && otherIo.acceptsCategory("energy")) ||
          (io.acceptsCategory("fluid") && otherIo.acceptsCategory("fluid")) ||
          (io.acceptsCategory("gas") && otherIo.acceptsCategory("gas"));

        return matchExact ? "connect" : "border";
      }

      if (
        await arraySomeAsync(io.categories as string[], (category) =>
          otherIo.acceptsAnyTypeOfCategory(category),
        )
      ) {
        return "border";
      }

      return "none";
    });
  },
  onPlayerInteract(e) {
    const player = e.player!;

    const heldSlot = getEntityComponent(player, "equippable")!.getEquipmentSlot(
      EquipmentSlot.Mainhand,
    );

    if (!heldSlot.hasItem()) return;

    switch (heldSlot.typeId) {
      case "fluffyalien_energistics:energy_conduit":
        if (e.block.permutation.getState("fluffyalien_energistics:energy")) {
          break;
        }

        e.block.setPermutation(
          e.block.permutation.withState("fluffyalien_energistics:energy", true),
        );
        void MachineNetwork.updateAdjacent(e.block);
        decrementSlotSurvival(player, heldSlot);
        break;
      case "fluffyalien_energistics:fluid_conduit":
        if (e.block.permutation.getState("fluffyalien_energistics:fluid")) {
          break;
        }

        e.block.setPermutation(
          e.block.permutation.withState("fluffyalien_energistics:fluid", true),
        );
        void MachineNetwork.updateAdjacent(e.block);
        decrementSlotSurvival(player, heldSlot);
        break;
      case "fluffyalien_energistics:gas_conduit":
        if (e.block.permutation.getState("fluffyalien_energistics:gas")) {
          break;
        }

        e.block.setPermutation(
          e.block.permutation.withState("fluffyalien_energistics:gas", true),
        );
        void MachineNetwork.updateAdjacent(e.block);
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
