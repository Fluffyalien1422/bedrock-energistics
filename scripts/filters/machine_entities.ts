import * as fs from "fs";
import * as path from "path";

interface Machine {
  id: string;
  inventorySize: number;
  persistent?: boolean;
}

const bpDir = "BP";

const entitiesDir = path.join(bpDir, "entities");
fs.mkdirSync(entitiesDir);

const machineEntitiesDir = "data/machine_entities";

for (const fileName of fs.readdirSync(machineEntitiesDir, {
  recursive: true,
  encoding: "utf8",
})) {
  const content = JSON.parse(
    fs.readFileSync(path.join(machineEntitiesDir, fileName), "utf8"),
  ) as Machine;

  const description = {
    identifier: content.id,
    is_summonable: true,
    is_spawnable: false,
  };

  const components = {
    "minecraft:breathable": {
      breathes_water: true,
    },
    "minecraft:physics": {
      has_gravity: false,
      has_collision: false,
    },
    "minecraft:damage_sensor": {
      triggers: {
        deals_damage: "no",
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
      // must be bigger than the block's collision box (1x1 or less)
      // so the player can interact with it.
      width: 1.1,
      height: 1.1,
    },
    "minecraft:inventory": {
      container_type: "container",
      inventory_size: content.inventorySize,
    },
    "minecraft:type_family": {
      family: ["fluffyalien_energisticscore:machine_entity"],
    },
  };

  const entity = content.persistent
    ? {
        description,
        components: {
          "minecraft:persistent": {},
          ...components,
        },
      }
    : {
        description,
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
            time: { min: 60, max: 60 },
            time_down_event: {
              event: "fluffyalien_energistics:despawn",
            },
          },
          ...components,
        },
        events: {
          "fluffyalien_energistics:despawn": {
            add: {
              component_groups: ["fluffyalien_energistics:despawn"],
            },
          },
        },
      };

  fs.writeFileSync(
    path.join(entitiesDir, path.basename(fileName)),
    JSON.stringify({
      format_version: "1.26.60",
      "minecraft:entity": entity,
    }),
  );
}
