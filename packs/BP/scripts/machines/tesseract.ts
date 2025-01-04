import { BlockCustomComponent, Player, system, world } from "@minecraft/server";
import {
  MachineDefinition,
  MachineNetwork,
  NetworkLinkNode,
} from "bedrock-energistics-core-api";
import { ModalFormData } from "@minecraft/server-ui";
import { getEntitiesInAllDimensions } from "../utils/dimension";
import { Vector3Utils } from "@minecraft/math";

export const tesseractMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:tesseract",
    ui: {
      elements: {
        optionsButton: {
          type: "button",
          index: 0,
          defaults: {
            itemId: "fluffyalien_energistics:ui_options_button",
          },
        },
      },
    },
  },
  events: {
    onButtonPressed(e) {
      const block = e.blockLocation.dimension.getBlock(e.blockLocation);
      if (!block) return;

      const networkLink = NetworkLinkNode.get(block);
      const entity = networkLink.getInternalEntity();

      world.getEntity(e.entityId)?.remove();

      const currentName = (entity.getDynamicProperty("tesseract_name") ??
        "") as string;

      const form = new ModalFormData()
        .title({
          translate: "tile.fluffyalien_energistics:tesseract.name",
        })
        .textField(
          {
            translate: "fluffyalien_energistics.ui.tesseract.options.name",
          },
          "",
          currentName,
        );

      const player = world.getEntity(e.playerId) as Player;

      void system.waitTicks(4).then(async () => {
        const response = await form.show(player);
        if (!response.formValues) return;

        const newName = response.formValues[0];

        if (currentName === newName) return;

        entity.setDynamicProperty("tesseract_name", newName);
      });
    },
  },
};

export const tesseractComponent: BlockCustomComponent = {
  onTick(e) {
    const networkLink = NetworkLinkNode.get(e.block);
    const entity = networkLink.getInternalEntity();
    const name = entity.getDynamicProperty("tesseract_name") as string;

    void networkLink.getConnections().then((oldConnections) => {
      const newConnections = [];

      if (name) {
        for (const target of getEntitiesInAllDimensions({
          type: entity.typeId,
        })) {
          if (target.getDynamicProperty("tesseract_name") === name) {
            newConnections.push(target.location);
          }
        }
      }

      let connectionsChanged = false;

      for (const newConnection of newConnections) {
        if (
          !oldConnections.some((old) => Vector3Utils.equals(old, newConnection))
        ) {
          void networkLink.addConnection(newConnection);
          connectionsChanged = true;
        }
      }

      for (const oldConnection of oldConnections) {
        if (
          !newConnections.some((newConn) =>
            Vector3Utils.equals(newConn, oldConnection),
          )
        ) {
          void networkLink.removeConnection(oldConnection);
          connectionsChanged = true;
        }
      }

      if (connectionsChanged) {
        void MachineNetwork.updateWithBlock(e.block);
      }
    });
  },
};
