import { world } from "@minecraft/server";
import { conduitComponent } from "./conduit";

world.beforeEvents.worldInitialize.subscribe((e) => {
  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energistics:conduit",
    conduitComponent,
  );
});
