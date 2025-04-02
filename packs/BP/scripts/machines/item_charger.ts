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

const ENERGY_CONSUMPTION = 20;

export const itemChargerMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:item_charger",
    persistentEntity: true,
    ui: {
      elements: {
        energyBar: {
          type: "storageBar",
          startIndex: 0,
          defaults: { type: "energy" },
        },
      },
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
