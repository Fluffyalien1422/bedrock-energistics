import {
  generate,
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
  StandardStorageType,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { MAX_MACHINE_STORAGE } from "../constants";
import { BlockStateAccessor } from "../utils/block";

const NITROGEN_CONSUMPTION = 1;
const HYDROGEN_CONSUMPTION = 3;
const ENERGY_CONSUMPTION = 10;
const AMMONIA_GENERATION = 2;

export const ammoniaFactoryMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:ammonia_factory",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: StandardStorageType.Energy,
          },
        },
        nitrogenBar: {
          type: "storageBar",
          startIndex: 4,
          defaults: {
            type: StandardStorageType.Nitrogen,
          },
        },
        hydrogenBar: {
          type: "storageBar",
          startIndex: 8,
          defaults: {
            type: StandardStorageType.Hydrogen,
          },
        },
        ammoniaBar: {
          type: "storageBar",
          startIndex: 12,
          defaults: {
            type: StandardStorageType.Ammonia,
          },
        },
      },
    },
  },
};

export const ammoniaFactoryComponent: BlockCustomComponent = {
  onTick({ block }) {
    const workingState = new BlockStateAccessor<boolean>(
      block,
      "fluffyalien_energistics:working",
    );

    const storedEnergy = getMachineStorage(block, StandardStorageType.Energy);
    const storedNitrogen = getMachineStorage(
      block,
      StandardStorageType.Nitrogen,
    );
    const storedHydrogen = getMachineStorage(
      block,
      StandardStorageType.Hydrogen,
    );
    const storedAmmonia = getMachineStorage(block, StandardStorageType.Ammonia);

    if (
      storedEnergy < ENERGY_CONSUMPTION ||
      storedNitrogen < NITROGEN_CONSUMPTION ||
      storedHydrogen < HYDROGEN_CONSUMPTION ||
      storedAmmonia + AMMONIA_GENERATION > MAX_MACHINE_STORAGE
    ) {
      generate(block, StandardStorageType.Ammonia, 0);
      workingState.set(false);
      return;
    }

    void setMachineStorage(
      block,
      StandardStorageType.Energy,
      storedEnergy - ENERGY_CONSUMPTION,
    );
    void setMachineStorage(
      block,
      StandardStorageType.Nitrogen,
      storedNitrogen - NITROGEN_CONSUMPTION,
    );
    void setMachineStorage(
      block,
      StandardStorageType.Hydrogen,
      storedHydrogen - HYDROGEN_CONSUMPTION,
    );
    generate(block, StandardStorageType.Ammonia, AMMONIA_GENERATION);

    workingState.set(true);
  },
};
