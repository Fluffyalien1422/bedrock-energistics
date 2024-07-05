import * as fs from "fs";
import * as path from "path";
import { TMP_DIR } from "./common";

interface Machine {
  id: string;
  inventorySize: number;
}

const bpDir = path.join(TMP_DIR, "BP");

const entitiesDir = path.join(bpDir, "entities");
fs.mkdirSync(entitiesDir);

const machineEntitiesDir = path.join(TMP_DIR, "data/machine_entities");

for (const fileName of fs.readdirSync(machineEntitiesDir, {
  recursive: true,
  encoding: "utf8",
})) {
  const content = JSON.parse(
    fs.readFileSync(path.join(machineEntitiesDir, fileName), "utf8"),
  ) as Machine;

  const entityId = `${content.id}_entity`;

  fs.writeFileSync(
    path.join(entitiesDir, path.basename(fileName)),
    JSON.stringify({
      format_version: "1.21.0",
      "minecraft:entity": {
        description: {
          identifier: entityId,
          is_summonable: true,
          is_spawnable: false,
        },
        component_groups: {
          "fluffyalien_energistics:despawn": {
            "minecraft:instant_despawn": {},
          },
        },
        components: {
          "minecraft:despawn": {
            despawn_from_distance: {
              min_distance: 10,
              max_distance: 20,
            },
          },
          "minecraft:timer": {
            time: 60,
            time_down_event: {
              event: "fluffyalien_energistics:despawn",
            },
          },
          "minecraft:breathable": {
            breathes_water: true,
          },
          "minecraft:physics": {
            has_gravity: false,
            has_collision: false,
          },
          "minecraft:damage_sensor": {
            triggers: {
              deals_damage: false,
            },
          },
          "minecraft:pushable": {
            is_pushable: false,
            is_pushable_by_piston: false,
          },
          "minecraft:knockback_resistance": {
            value: 1,
          },
          "minecraft:collision_box": {
            width: 1,
            height: 1,
          },
          "minecraft:inventory": {
            container_type: "container",
            inventory_size: content.inventorySize,
          },
          "minecraft:type_family": {
            family: ["fluffyalien_energisticscore:machine_entity"],
          },
        },
        events: {
          "fluffyalien_energistics:despawn": {
            add: {
              component_groups: ["fluffyalien_energistics:despawn"],
            },
          },
        },
      },
    }),
  );
}
