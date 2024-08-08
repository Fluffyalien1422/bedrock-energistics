import { MachineDefinition } from "@/becore_api";
import { BlockCustomComponent } from "@minecraft/server";

const GAS_TYPES: Record<string, string> = {
  "minecraft:overworld": "nitrogen",
  "minecraft:nether": "carbon",
  "minecraft:the_end": "hydrogen",
};

export const atmosphericCondenserMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:atmospheric_condenser",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
        outputGasBar: {
          type: "storageBar",
          startIndex: 4,
        },
      },
    },
  },
  handlers: {
    updateUi(location) {
      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: 0,
          },
          {
            element: "outputGasBar",
            type: GAS_TYPES[location.dimension.id],
            change: 0,
          },
        ],
      };
    },
  },
};

export const atmosphericCondenserComponent: BlockCustomComponent = {};
