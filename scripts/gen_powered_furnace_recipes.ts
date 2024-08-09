/**
 * Generates the packs/BP/scripts/generated/powered_furnace_recipes.ts file
 * example use: npm run tsx scripts/gen_powered_furnace_recipes path_to_bedrock_samples
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const ID_OVERRIDES: Record<string, string | null> = {
  "minecraft:coal:1": "minecraft:charcoal",
  "minecraft:wood:0": "minecraft:oak_wood",
  "minecraft:wood:1": "minecraft:spruce_wood",
  "minecraft:wood:2": "minecraft:birch_wood",
  "minecraft:wood:3": "minecraft:jungle_wood",
  "minecraft:wood:4": "minecraft:acacia_wood",
  "minecraft:wood:5": "minecraft:dark_oak_wood",
  "minecraft:wood:8": "minecraft:stripped_oak_wood",
  "minecraft:wood:9": "minecraft:stripped_spurce_wood",
  "minecraft:wood:10": "minecraft:stripped_birch_wood",
  "minecraft:wood:11": "minecraft:stripped_jungle_wood",
  "minecraft:wood:12": "minecraft:stripped_acacia_wood",
  "minecraft:wood:13": "minecraft:stripped_dark_oak_wood",
  "minecraft:log:0": "minecraft:oak_log",
  "minecraft:log:1": "minecraft:spruce_log",
  "minecraft:log:2": "minecraft:birch_log",
  "minecraft:log:3": "minecraft:jungle_log",
  "minecraft:log2:0": "minecraft:acacia_log",
  "minecraft:log2:1": "minecraft:dark_oak_log",
  "minecraft:dye:2": "minecraft:green_dye",
  "minecraft:dye:4": "minecraft:lapis_lazuli",
  "minecraft:dye:10": "minecraft:lime_dye",
  "minecraft:quartz_block:0": "minecraft:quartz_block",
  "minecraft:sponge:0": "minecraft:sponge",
  "minecraft:sponge:1": "minecraft:wet_sponge",
  "minecraft:stained_hardened_clay:0": "minecraft:white_terracotta",
  "minecraft:stained_hardened_clay:1": "minecraft:orange_terracotta",
  "minecraft:stained_hardened_clay:2": "minecraft:magenta_terracotta",
  "minecraft:stained_hardened_clay:3": "minecraft:light_blue_terracotta",
  "minecraft:stained_hardened_clay:4": "minecraft:yellow_terracotta",
  "minecraft:stained_hardened_clay:5": "minecraft:lime_terracotta",
  "minecraft:stained_hardened_clay:6": "minecraft:pink_terracotta",
  "minecraft:stained_hardened_clay:7": "minecraft:gray_terracotta",
  "minecraft:stained_hardened_clay:8": "minecraft:light_gray_terracotta",
  "minecraft:stained_hardened_clay:9": "minecraft:cyan_terracotta",
  "minecraft:stained_hardened_clay:10": "minecraft:purple_terracotta",
  "minecraft:stained_hardened_clay:11": "minecraft:blue_terracotta",
  "minecraft:stained_hardened_clay:12": "minecraft:brown_terracotta",
  "minecraft:stained_hardened_clay:13": "minecraft:green_terracotta",
  "minecraft:stained_hardened_clay:14": "minecraft:red_terracotta",
  "minecraft:stained_hardened_clay:15": "minecraft:black_terracotta",
  "minecraft:stone:0": "minecraft:stone",
  "minecraft:fish": "minecraft:cod",
  "minecraft:cooked_fish": "minecraft:cooked_cod",
  "minecraft:horsearmorgold": "minecraft:golden_horse_armor",
  "minecraft:horsearmoriron": "minecraft:iron_horse_armor",
  "minecraft:muttonRaw": "minecraft:mutton",
  "minecraft:muttonCooked": "minecraft:cooked_mutton",
  // unflattened IDS
  "minecraft:quartz_block:3": null,
  "minecraft:red_sandstone:3": null,
  "minecraft:sandstone:3": null,
};

const tmpDirPath = fs.mkdtempSync("tmp_gen_powered_furnace_recipes");

console.log("downloading bedrock samples");

execSync("git clone https://github.com/Mojang/bedrock-samples", {
  cwd: tmpDirPath,
});

const bedrockRecipesPath = path.join(
  tmpDirPath,
  "bedrock-samples/behavior_pack/recipes",
);

interface FurnaceRecipe {
  input: string;
  output:
    | string
    | {
        item: string;
        count?: number;
      };
}

const inputItems: string[] = [];
const outputItems: string[] = [];
const outputCounts: number[] = [];

console.log("reading recipes");

for (const fileName of fs.readdirSync(bedrockRecipesPath)) {
  const content = JSON.parse(
    fs.readFileSync(path.join(bedrockRecipesPath, fileName), "utf8"),
  ) as object;

  if (!("minecraft:recipe_furnace" in content)) {
    continue;
  }

  const recipe = content["minecraft:recipe_furnace"] as FurnaceRecipe;

  if (typeof recipe.input === "object") {
    continue;
  }

  const inputOverride = ID_OVERRIDES[recipe.input] as string | null | undefined;
  if (inputOverride === null) {
    continue;
  }

  const outputOverride = ID_OVERRIDES[
    typeof recipe.output === "string" ? recipe.output : recipe.output.item
  ] as string | null | undefined;

  if (outputOverride === null) {
    continue;
  }

  inputItems.push(inputOverride ?? recipe.input);
  if (typeof recipe.output === "string") {
    outputItems.push(outputOverride ?? recipe.output);
    outputCounts.push(1);
  } else {
    outputItems.push(outputOverride ?? recipe.output.item);
    outputCounts.push(recipe.output.count ?? 1);
  }
}

console.log("finishing up");

fs.rmSync(tmpDirPath, { recursive: true });

fs.writeFileSync(
  "packs/BP/scripts/generated/powered_furnace_recipes.ts",
  `export const POWERED_FURNACE_INPUT_ITEMS=${JSON.stringify(inputItems)};export const POWERED_FURNACE_OUTPUT_ITEMS=${JSON.stringify(outputItems)};export const POWERED_FURNACE_OUTPUT_ITEM_COUNTS=${JSON.stringify(outputCounts)};`,
);
