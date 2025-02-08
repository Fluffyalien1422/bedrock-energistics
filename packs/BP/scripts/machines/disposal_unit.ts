import { BlockCustomComponent, system } from "@minecraft/server";
import {
  getMachineStorage,
  MachineDefinition,
  setMachineStorage,
  StandardStorageType,
} from "bedrock-energistics-core-api";
import { BlockStateAccessor } from "../utils/block";

export const disposalUnitMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:disposal_unit",
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: {
            type: StandardStorageType.Energy,
          },
        },
      },
    },
  },
  handlers: {
    receive(e) {
      if (e.receiveType === StandardStorageType.Energy) return {};

      const storedEnergy = getMachineStorage(
        e.blockLocation,
        StandardStorageType.Energy,
      );
      const energyConsumption = Math.floor(e.receiveAmount / 2);

      if (storedEnergy < energyConsumption) {
        return {
          amount: 0,
        };
      }

      const block = e.blockLocation.dimension.getBlock(e.blockLocation);
      if (!block) {
        return {
          amount: 0,
        };
      }

      setMachineStorage(
        block,
        StandardStorageType.Energy,
        storedEnergy - energyConsumption,
      );

      system.run(() => {
        setMachineStorage(block, e.receiveType, 0);
      });

      return {};
    },
  },
};

export const disposalUnitComponent: BlockCustomComponent = {
  onTick(e) {
    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    workingState.set(
      getMachineStorage(e.block, StandardStorageType.Energy) > 0,
    );
  },
};
