import { MachineDefinition } from "@/becore_api";

export const oilExtractorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:oil_extractor",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
        oilBar: {
          type: "storageBar",
          startIndex: 4,
        },
      },
    },
  },
  handlers: {
    updateUi() {
      return {
        storageBars: [
          {
            element: "energyBar",
            type: "energy",
            change: 0,
          },
          {
            element: "oilBar",
            type: "oil",
            change: 0,
          },
        ],
      };
    },
  },
};
