import {
  BlockCustomComponent,
  BlockPermutation,
  EquipmentSlot,
  GameMode,
  ItemStack,
} from "@minecraft/server";
import { updateBlockConnectStates } from "./utils/block";
import {
  reverseDirection,
  STR_DIRECTIONS,
  strDirectionToDirection,
} from "./utils/direction";
import { decrementSlotSurvival } from "./utils/item";
import { getEntityComponent } from "./polyfills/component_type_map";
import { IoCapabilities, MachineNetwork } from "bedrock-energistics-core-api";
import { arraySomeAsync } from "./utils/async";
import { BlockStateSuperset } from "@minecraft/vanilla-data";

export const energyConduitComponent: BlockCustomComponent = {
  onTick({ block }) {
    void updateBlockConnectStates(block, STR_DIRECTIONS, (other, direction) =>
      IoCapabilities.fromMachine(
        other,
        reverseDirection(strDirectionToDirection(direction)),
      ).acceptsAnyTypeOfCategory("energy", true),
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
    void updateBlockConnectStates(block, STR_DIRECTIONS, (other, direction) =>
      IoCapabilities.fromMachine(
        other,
        reverseDirection(strDirectionToDirection(direction)),
      ).acceptsAnyTypeOfCategory("fluid", true),
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
    void updateBlockConnectStates(block, STR_DIRECTIONS, (other, direction) =>
      IoCapabilities.fromMachine(
        other,
        reverseDirection(strDirectionToDirection(direction)),
      ).acceptsAnyTypeOfCategory("gas", true),
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
    void updateBlockConnectStates(
      block,
      STR_DIRECTIONS,
      async (other, strDirection) => {
        const direction = strDirectionToDirection(strDirection);
        const reversedDirection = reverseDirection(direction);

        const io = IoCapabilities.fromMachine(block, direction);
        const otherIo = IoCapabilities.fromMachine(other, reversedDirection);

        if (other.typeId === "fluffyalien_energistics:multi_conduit") {
          const matchExact =
            (io.acceptsCategory("energy") &&
              otherIo.acceptsCategory("energy", true)) ||
            (io.acceptsCategory("fluid") &&
              otherIo.acceptsCategory("fluid", true)) ||
            (io.acceptsCategory("gas") && otherIo.acceptsCategory("gas", true));

          return matchExact ? "connect" : "border";
        }

        if (
          await arraySomeAsync(io.categories, (category) =>
            otherIo.acceptsAnyTypeOfCategory(category, true),
          )
        ) {
          return "border";
        }

        return "none";
      },
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
        if (
          e.block.permutation.getState(
            "fluffyalien_energistics:energy" as keyof BlockStateSuperset,
          )
        ) {
          break;
        }

        e.block.setPermutation(
          e.block.permutation.withState(
            "fluffyalien_energistics:energy" as keyof BlockStateSuperset,
            true,
          ),
        );
        void MachineNetwork.updateAdjacent(e.block);
        decrementSlotSurvival(player, heldSlot);
        break;
      case "fluffyalien_energistics:fluid_conduit":
        if (
          e.block.permutation.getState(
            "fluffyalien_energistics:fluid" as keyof BlockStateSuperset,
          )
        ) {
          break;
        }

        e.block.setPermutation(
          e.block.permutation.withState(
            "fluffyalien_energistics:fluid" as keyof BlockStateSuperset,
            true,
          ),
        );
        void MachineNetwork.updateAdjacent(e.block);
        decrementSlotSurvival(player, heldSlot);
        break;
      case "fluffyalien_energistics:gas_conduit":
        if (
          e.block.permutation.getState(
            "fluffyalien_energistics:gas" as keyof BlockStateSuperset,
          )
        ) {
          break;
        }

        e.block.setPermutation(
          e.block.permutation.withState(
            "fluffyalien_energistics:gas" as keyof BlockStateSuperset,
            true,
          ),
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
      e.destroyedBlockPermutation.getState(
        "fluffyalien_energistics:energy" as keyof BlockStateSuperset,
      )
    ) {
      e.dimension.spawnItem(
        new ItemStack("fluffyalien_energistics:energy_conduit"),
        center,
      );
    }

    if (
      e.destroyedBlockPermutation.getState(
        "fluffyalien_energistics:fluid" as keyof BlockStateSuperset,
      )
    ) {
      e.dimension.spawnItem(
        new ItemStack("fluffyalien_energistics:fluid_conduit"),
        center,
      );
    }

    if (
      e.destroyedBlockPermutation.getState(
        "fluffyalien_energistics:gas" as keyof BlockStateSuperset,
      )
    ) {
      e.dimension.spawnItem(
        new ItemStack("fluffyalien_energistics:gas_conduit"),
        center,
      );
    }
  },
};
