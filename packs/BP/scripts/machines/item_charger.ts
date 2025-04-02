import {
  getMachineStorage,
  ItemMachine,
  MachineDefinition,
  RegisteredItemMachine,
  setMachineStorage,
} from "bedrock-energistics-core-api";
import { getEntityAtBlockLocation } from "../utils/location";
import { BlockCustomComponent } from "@minecraft/server";
import { BlockStateAccessor } from "../utils/block";
import { getEntityComponent } from "../polyfills/component_type_map";
import { MACHINE_TICK_INTERVAL } from "../constants";
import { BlockStateSuperset } from "@minecraft/vanilla-data";

const ENERGY_CONSUMPTION = 20;
const ENERGY_CONSUMPTION_PER_TICK = ENERGY_CONSUMPTION / MACHINE_TICK_INTERVAL;

export const itemChargerMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:item_charger",
    persistentEntity: true,
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
        },
      },
    },
  },
  handlers: {
    updateUi({ blockLocation }) {
      const block = blockLocation.dimension.getBlock(blockLocation);

      const working = block?.permutation.getState(
        "fluffyalien_energistics:working" as keyof BlockStateSuperset,
      ) as boolean;

      return {
        storageBars: {
          energyBar: {
            type: "energy",
            change: working ? -ENERGY_CONSUMPTION_PER_TICK : 0,
          },
        },
      };
    },
  },
};

export const itemChargerComponent: BlockCustomComponent = {
  onTick(e) {
    const entity = getEntityAtBlockLocation(
      e.block,
      "fluffyalien_energistics:item_charger",
    );
    if (!entity) return;

    const workingState = new BlockStateAccessor<boolean>(
      e.block,
      "fluffyalien_energistics:working",
    );

    const storedEnergy = getMachineStorage(e.block, "energy");
    if (storedEnergy < ENERGY_CONSUMPTION) {
      workingState.set(false);
      return;
    }

    const inventory = getEntityComponent(entity, "inventory")!;

    const itemTypeId = inventory.container?.getItem(4)?.typeId;
    if (!itemTypeId) {
      workingState.set(false);
      return;
    }

    void RegisteredItemMachine.get(itemTypeId).then(
      async (registeredItemMachine) => {
        if (!registeredItemMachine) {
          workingState.set(false);
          return;
        }

        const itemMachine = new ItemMachine(inventory, 4);
        const itemMachineIo = await itemMachine.getIo();
        const acceptsEnergy = await itemMachineIo.acceptsTypeWithId("energy");
        if (!acceptsEnergy) {
          workingState.set(false);
          return;
        }

        const itemStoredEnergy = await itemMachine.getStorage("energy");

        const amountToAdd = Math.min(
          ENERGY_CONSUMPTION,
          registeredItemMachine.maxStorage - itemStoredEnergy,
        );

        if (amountToAdd <= 0) return;

        itemMachine.setStorage("energy", itemStoredEnergy + amountToAdd);
        void setMachineStorage(e.block, "energy", storedEnergy - amountToAdd);

        workingState.set(true);
      },
    );
  },
};
