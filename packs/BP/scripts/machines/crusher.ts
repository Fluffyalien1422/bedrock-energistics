const RECIPES: Record<string, string> = {
  "minecraft:stone": "minecraft:cobblestone",
  "minecraft:cobblestone": "minecraft:gravel",
  "minecraft:gravel": "minecraft:sand",
};

const progressMap = new Map<string, number>();
