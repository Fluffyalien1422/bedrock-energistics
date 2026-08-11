/**
 * Generates the UI icon items & textures based on the composite images in packs/data/ui_composite
 */

import * as imgManip from "imagescript";
import * as fs from "fs";
import * as path from "path";

const TILE_SIZE = 16;

const specialIconsDir = "data/ui_composite/special_icons";

const itemTexturePath = "RP/textures/item_texture.json";

const itemTexture = JSON.parse(fs.readFileSync(itemTexturePath, "utf8")) as {
  texture_data: Record<string, { textures: string }>;
};

function readImg(imgPath: string): Promise<imgManip.Image> {
  return imgManip.decode(fs.readFileSync(imgPath)) as Promise<imgManip.Image>;
}

function createUiItem(itemId: string): string {
  return JSON.stringify({
    format_version: "1.26.40",
    "minecraft:item": {
      description: {
        identifier: itemId,
        menu_category: {
          category: "none",
          is_hidden_in_commands: true,
        },
      },
      components: {
        "minecraft:tags": {
          tags: ["fluffyalien_energisticscore:ui_item"],
        },
        "minecraft:icon": itemId,
      },
    },
  });
}

/**
 * Extracts the tile at the given tile coordinates from `img`. Space outside of `img` is left
 * transparent. Pixels are copied rather than composited so that partially transparent pixels
 * aren't blended with the transparent background.
 */
function extractTile(
  img: imgManip.Image,
  tileX: number,
  tileY: number,
): imgManip.Image {
  // a new image is fully transparent
  const tile = new imgManip.Image(TILE_SIZE, TILE_SIZE);

  const width = Math.min(TILE_SIZE, img.width - tileX * TILE_SIZE);
  const height = Math.min(TILE_SIZE, img.height - tileY * TILE_SIZE);

  // imagescript pixel coordinates start at 1
  for (let y = 1; y <= height; y++) {
    for (let x = 1; x <= width; x++) {
      tile.setPixelAt(
        x,
        y,
        img.getPixelAt(tileX * TILE_SIZE + x, tileY * TILE_SIZE + y),
      );
    }
  }

  return tile;
}

// special icons
// these are split into a grid of 16x16 textures, the item ID of each tile is
// `ui_${iconName}_${tileX}_${tileY}` where (0, 0) is the top left tile

for (const fileName of fs.readdirSync(specialIconsDir)) {
  const iconName = path.basename(fileName, ".png");
  const img = await readImg(path.join(specialIconsDir, fileName));

  const tilesX = Math.ceil(img.width / TILE_SIZE);
  const tilesY = Math.ceil(img.height / TILE_SIZE);

  for (let tileY = 0; tileY < tilesY; tileY++) {
    for (let tileX = 0; tileX < tilesX; tileX++) {
      const shortId = `ui_${iconName}_${tileX.toString()}_${tileY.toString()}`;
      const itemId = `fluffyalien_energistics:${shortId}`;

      fs.writeFileSync(`BP/items/${shortId}.json`, createUiItem(itemId));

      const texturePath = `textures/fluffyalien/energistics/${shortId}`;
      itemTexture.texture_data[itemId] = { textures: texturePath };

      fs.writeFileSync(
        `RP/${texturePath}.png`,
        await extractTile(img, tileX, tileY).encode(),
      );
    }
  }
}

fs.writeFileSync(itemTexturePath, JSON.stringify(itemTexture));
