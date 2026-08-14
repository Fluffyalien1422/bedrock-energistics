/**
 * Generates the UI icon items & textures based on the composite images in packs/data/ui_composite
 */

import * as imgManip from "imagescript";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { addItemTextureData, type ItemTextureData } from "./common.ts";

const TILE_SIZE = 16;

const specialIconsDir = "data/ui_composite/special_icons";

/**
 * A special icon whose name ends in `PROGRESS_EMPTY_SUFFIX` is the unfilled state of
 * a progress icon, and the one ending in `PROGRESS_FULL_SUFFIX` is its filled state.
 * Instead of one icon, the pair generates one icon per frame.
 * @see {@link writeProgressIconFrames}
 */
const PROGRESS_EMPTY_SUFFIX = "_empty";
const PROGRESS_FULL_SUFFIX = "_full";

const textureData: ItemTextureData = {};

/**
 * The short IDs of the tiles that were fully transparent, and so were not generated.
 * Written to `BP/scripts/ui_composite_icons.js` for the behavior pack to read.
 * @see {@link writeTile}
 */
const transparentTiles: string[] = [];

/**
 * The short ID of a tile that was not generated, mapped to the short ID of the already
 * generated tile with the same texture. Written to `BP/scripts/ui_composite_icons.js`
 * for the behavior pack to read.
 * @see {@link writeTile}
 */
const tileRedirects: Record<string, string> = {};

/**
 * The short ID of every generated tile, keyed by the hash of its pixels.
 * @see {@link writeTile}
 */
const tilesByPixelHash = new Map<string, string>();

/**
 * Hashes the pixels of `img`.
 * @remarks
 * Hashing the pixels rather than the encoded PNG matters: `encode` does not always
 * produce the same bytes for the same pixels, so hashing its output misses duplicates.
 */
function hashPixels(img: imgManip.Image): string {
  return crypto
    .createHash("sha1")
    .update(new Uint8Array(img.bitmap))
    .digest("hex");
}

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

function isFullyTransparent(img: imgManip.Image): boolean {
  // imagescript pixel coordinates start at 1
  for (let y = 1; y <= img.height; y++) {
    for (let x = 1; x <= img.width; x++) {
      // the low byte of a pixel is its alpha
      if ((img.getPixelAt(x, y) & 0xff) !== 0) return false;
    }
  }

  return true;
}

/**
 * Writes the item and texture for one tile of `img`. The item ID is
 * `ui_${iconName}_${tileX}_${tileY}` where (0, 0) is the top left tile.
 * @remarks
 * Two kinds of tile produce no item or texture of their own. A fully transparent tile
 * renders as nothing, so it is recorded in `transparentTiles` and the behavior pack
 * draws a shared empty UI item instead. A tile whose texture matches one already
 * generated is recorded in `tileRedirects`, pointing at that tile, and the behavior
 * pack uses the existing item.
 */
async function writeTile(
  iconName: string,
  img: imgManip.Image,
  tileX: number,
  tileY: number,
): Promise<void> {
  const shortId = `ui_${iconName}_${tileX.toString()}_${tileY.toString()}`;
  const tile = extractTile(img, tileX, tileY);

  if (isFullyTransparent(tile)) {
    transparentTiles.push(shortId);
    return;
  }

  const pixelHash = hashPixels(tile);

  const existingTile = tilesByPixelHash.get(pixelHash);
  if (existingTile !== undefined) {
    tileRedirects[shortId] = existingTile;
    return;
  }

  tilesByPixelHash.set(pixelHash, shortId);

  const itemId = `fluffyalien_energistics:${shortId}`;

  fs.writeFileSync(`BP/items/${shortId}.json`, createUiItem(itemId));

  const texturePath = `textures/fluffyalien/energistics/${shortId}`;
  textureData[itemId] = { textures: texturePath };

  fs.writeFileSync(`RP/${texturePath}.png`, await tile.encode());
}

/**
 * Splits `img` into a grid of 16x16 textures and writes the item and texture for each
 * tile.
 */
async function writeIconTiles(
  iconName: string,
  img: imgManip.Image,
): Promise<void> {
  const tilesX = Math.ceil(img.width / TILE_SIZE);
  const tilesY = Math.ceil(img.height / TILE_SIZE);

  for (let tileY = 0; tileY < tilesY; tileY++) {
    for (let tileX = 0; tileX < tilesX; tileX++) {
      await writeTile(iconName, img, tileX, tileY);
    }
  }
}

/**
 * Builds the frames of a progress icon by revealing `fullImg` over `emptyImg` one pixel
 * column at a time, left to right, and writes the tiles of each frame as the icon
 * `${baseName}_${frame}`. Frame 0 is entirely empty and the last frame is entirely full,
 * so the icon's highest frame index is the width of the image.
 * @remarks
 * Most of these tiles repeat: a tile only changes while the reveal is inside its own
 * column of the image, so every frame before that leaves it fully empty and every frame
 * after leaves it fully full. `writeTile` redirects the repeats to the tile they match
 * rather than duplicating them.
 */
async function writeProgressIconFrames(
  baseName: string,
  emptyImg: imgManip.Image,
  fullImg: imgManip.Image,
): Promise<void> {
  if (emptyImg.width !== fullImg.width || emptyImg.height !== fullImg.height) {
    throw new Error(
      `Failed to generate the progress icon '${baseName}'. Its '${PROGRESS_EMPTY_SUFFIX}' image is ${emptyImg.width.toString()}x${emptyImg.height.toString()} but its '${PROGRESS_FULL_SUFFIX}' image is ${fullImg.width.toString()}x${fullImg.height.toString()}. Both must be the same size.`,
    );
  }

  for (let frame = 0; frame <= emptyImg.width; frame++) {
    const img = emptyImg.clone();

    if (frame > 0) {
      const revealed = fullImg.clone();
      revealed.crop(0, 0, frame, fullImg.height);

      img.composite(revealed);
    }

    await writeIconTiles(`${baseName}_${frame.toString()}`, img);
  }
}

// special icons
// sorted so that which tile a duplicate redirects to doesn't depend on the order the
// file system happens to list the icons in
for (const fileName of fs.readdirSync(specialIconsDir).sort()) {
  const iconName = path.basename(fileName, ".png");

  // handled alongside its '_empty' counterpart
  if (iconName.endsWith(PROGRESS_FULL_SUFFIX)) continue;

  const iconPath = path.join(specialIconsDir, fileName);

  if (iconName.endsWith(PROGRESS_EMPTY_SUFFIX)) {
    const baseName = iconName.slice(0, -PROGRESS_EMPTY_SUFFIX.length);

    await writeProgressIconFrames(
      baseName,
      await readImg(iconPath),
      await readImg(
        path.join(specialIconsDir, `${baseName}${PROGRESS_FULL_SUFFIX}.png`),
      ),
    );

    continue;
  }

  await writeIconTiles(iconName, await readImg(iconPath));
}

addItemTextureData(textureData);

fs.writeFileSync(
  "BP/scripts/ui_composite_icons.js",
  "export const TRANSPARENT_ICON_TILES=new Set(" +
    JSON.stringify(transparentTiles) +
    ");export const ICON_TILE_REDIRECTS=" +
    JSON.stringify(tileRedirects),
);
