import { world } from "@minecraft/server";

type MachineStorageType = "energy";
type MachineUiProgressIndicatorElementType = "arrow";

// ui
interface MachineUiStorageBarElement {
  type: "storageBar";
  startIndex: number;
}

interface MachineUiItemSlotElement {
  type: "itemSlot";
  index: number;
  slotId: number;
  allowedItems: string[];
}

interface MachineUiProgressIndicatorElement {
  type: "progressIndicator";
  indicator: MachineUiProgressIndicatorElementType;
  index: number;
}

type MachineUiElement =
  | MachineUiStorageBarElement
  | MachineUiItemSlotElement
  | MachineUiProgressIndicatorElement;

// systems
interface SolarGeneratorSystemOptions {
  system: "solarGenerator";
  baseGeneration: number;
  rainGeneration: number;
  outputBar: string;
}

interface TimedCraftingSystemRecipe {
  maxProgress: number;
  consumption: {
    type: MachineStorageType;
    amountPerProgress: number;
  }[];
  ingredients: {
    slot: string;
    item: string;
  }[];
  result: {
    slot: string;
    item: string;
    count?: number;
  }[];
}

interface TimedCraftingSystemOptions {
  system: "timedCrafting";
  progressIndicator: string;
  storageBars: {
    type: MachineStorageType;
    element: string;
  }[];
  recipes: TimedCraftingSystemRecipe[];
}

type SystemOptions = SolarGeneratorSystemOptions | TimedCraftingSystemOptions;

// registered machine
interface RegisteredMachine {
  description: {
    id: string;
    uiElements: Record<string, MachineUiElement>;
    workingState?: string;
  };
  systems: SystemOptions[];
}

const overworld = world.getDimension("overworld");

export function registerMachine(options: RegisteredMachine): void {
  overworld.runCommand(
    `scriptevent fluffyalien_energisticscore:register_machine ${JSON.stringify(options)}`,
  );
}
