/**
 * Generates the UI icon items and textures for the composite images in
 * `packs/data/tiled_icons`.
 *
 * A Bedrock Energistics Core UI element is a single 16x16 inventory slot, so an icon
 * bigger than that cannot be one item. This filter slices each source image into a grid
 * of 16x16 tiles and generates a hidden item and texture per tile, which the behavior
 * pack draws as one progress indicator element per tile. The helpers that build those
 * elements are in `packs/BP/scripts/utils/ui.ts`.
 *
 * Every source image is named `${name}.${method}.png`. The name is whatever the author
 * calls the icon and is never inspected; the method declares how the filter turns the
 * image into icons and is not part of the name, so it never reaches the build. The
 * methods are:
 *
 * - `static` is a single icon, so `sun_icon.static.png` becomes the tiles
 *   `ui_sun_icon_${tileX}_${tileY}`.
 * - `progress_${direction}_start` and `progress_${direction}_end` are the first and last
 *   frame of one progress icon, so both images of a pair share a name.
 *   `arrow.progress_right_start.png` and `arrow.progress_right_end.png` become one icon
 *   per frame, `arrow_${frame}`, built by revealing the end image over the start image a
 *   pixel at a time. The tiles of frame 3 are `ui_arrow_3_${tileX}_${tileY}`.
 *
 *   The direction is the way the icon fills. `right` grows from the left edge, which
 *   suits an arrow, and its highest frame is the width of the image. `up` grows from the
 *   bottom edge, which suits a flame, and its highest frame is the height.
 *
 * Each generated tile is written as a hidden item tagged as a Bedrock Energistics Core
 * UI item, a texture under `TEXTURE_BASE_PATH`, and an `item_texture.json` entry.
 *
 * Tiles that don't need an item of their own are skipped and recorded instead: fully
 * transparent ones, which render as nothing, and ones whose pixels match a tile already
 * generated. Both lists are written to `BP/scripts/tiled_icons.js` so the behavior
 * pack knows what to draw in their place. esbuild bundles that module, so this filter has
 * to run before `build_scripts` in `config.json`.
 *
 * To reuse this filter in another pack, change `NAMESPACE` and `TEXTURE_BASE_PATH` in
 * `common.ts`.
 */

import * as imgManip from "imagescript";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import {
  addItemTextureData,
  type ItemTextureData,
  NAMESPACE,
  TEXTURE_BASE_PATH,
} from "./common.ts";

const TILE_SIZE = 16;

const sourceDir = "data/tiled_icons";

/**
 * The direction a progress icon fills in, which is part of its composite method.
 * @see {@link writeProgressIconFrames}
 */
type ProgressDirection = "right" | "up";

/**
 * How a source image is turned into icons, declared as the second extension of its file
 * name. `sun_icon.static.png` is composited with the `static` method.
 * @remarks
 * A `progress_*_start` and `progress_*_end` are the first and last frame of one progress
 * icon, so the two images of a pair share a name. The direction between them is the way
 * the icon fills: `right` suits an arrow, `up` a flame.
 * @see {@link writeProgressIconFrames}
 */
const COMPOSITE_METHODS = [
  "static",
  "progress_right_start",
  "progress_right_end",
  "progress_up_start",
  "progress_up_end",
] as const;
type CompositeMethod = (typeof COMPOSITE_METHODS)[number];

function iconFileName(name: string, method: CompositeMethod): string {
  return `${name}.${method}.png`;
}

function isCompositeMethod(value: string): value is CompositeMethod {
  return (COMPOSITE_METHODS as readonly string[]).includes(value);
}

/**
 * Splits the name and the composite method out of the file name of a source image. The
 * name is whatever the author called the icon and is never inspected; only the method
 * extension is, and it is not part of the name, so it doesn't reach the build.
 */
function parseIconFileName(fileName: string): {
  iconName: string;
  method: CompositeMethod;
} {
  // `${iconName}.${method}.png`
  const withoutImgExt = path.basename(fileName, ".png");
  const methodExt = path.extname(withoutImgExt);
  const method = methodExt.slice(1);

  if (!isCompositeMethod(method)) {
    throw new Error(
      `Failed to read the tiled icon '${fileName}'. Its name must declare how to composite it, as '<name>.<method>.png', where the method is one of: ${COMPOSITE_METHODS.join(", ")}.`,
    );
  }

  return {
    iconName: path.basename(withoutImgExt, methodExt),
    method,
  };
}

const textureData: ItemTextureData = {};

/**
 * The short IDs of the tiles that were fully transparent, and so were not generated.
 * Written to `BP/scripts/tiled_icons.js` for the behavior pack to read.
 * @see {@link writeTile}
 */
const transparentTiles: string[] = [];

/**
 * The short ID of a tile that was not generated, mapped to the short ID of the already
 * generated tile with the same texture. Written to `BP/scripts/tiled_icons.js`
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

  const itemId = `${NAMESPACE}:${shortId}`;

  fs.writeFileSync(`BP/items/${shortId}.json`, createUiItem(itemId));

  const texturePath = `${TEXTURE_BASE_PATH}${shortId}`;
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
 * Builds the frames of a progress icon by revealing `endImg` over `startImg` one pixel at
 * a time in `direction`, and writes the tiles of each frame as the icon
 * `${name}_${frame}`. Frame 0 is entirely `startImg` and the last frame is entirely
 * `endImg`, so the icon's highest frame index is the width of the image for a `right`
 * reveal and its height for an `up` reveal.
 * @remarks
 * Most of these tiles repeat: a tile only changes while the reveal is inside it, so every
 * frame before that leaves it untouched and every frame after leaves it fully revealed.
 * `writeTile` redirects the repeats to the tile they match rather than duplicating them.
 */
async function writeProgressIconFrames(
  name: string,
  direction: ProgressDirection,
  startImg: imgManip.Image,
  endImg: imgManip.Image,
): Promise<void> {
  if (startImg.width !== endImg.width || startImg.height !== endImg.height) {
    throw new Error(
      `Failed to generate the progress icon '${name}'. Its start image is ${startImg.width.toString()}x${startImg.height.toString()} but its end image is ${endImg.width.toString()}x${endImg.height.toString()}. Both must be the same size.`,
    );
  }

  const maxFrame = direction === "right" ? startImg.width : startImg.height;

  for (let frame = 0; frame <= maxFrame; frame++) {
    const img = startImg.clone();

    if (frame > 0) {
      const revealed = endImg.clone();

      if (direction === "right") {
        // grow from the left edge
        revealed.crop(0, 0, frame, endImg.height);
        img.composite(revealed);
      } else {
        // grow from the bottom edge
        revealed.crop(0, endImg.height - frame, endImg.width, frame);
        img.composite(revealed, 0, endImg.height - frame);
      }
    }

    await writeIconTiles(`${name}_${frame.toString()}`, img);
  }
}

/**
 * Reads the pair of images that make up a progress icon and writes its frames.
 * @see {@link writeProgressIconFrames}
 */
async function writeProgressIcon(
  name: string,
  direction: ProgressDirection,
): Promise<void> {
  await writeProgressIconFrames(
    name,
    direction,
    await readImg(
      path.join(sourceDir, iconFileName(name, `progress_${direction}_start`)),
    ),
    await readImg(
      path.join(sourceDir, iconFileName(name, `progress_${direction}_end`)),
    ),
  );
}

/**
 * Throws unless the other half of a progress icon's pair is present. Without this the
 * pair would be skipped without a word, since only the start half generates anything.
 */
function requireCounterpart(
  fileName: string,
  name: string,
  counterpart: CompositeMethod,
): void {
  const counterpartFileName = iconFileName(name, counterpart);

  if (!fs.existsSync(path.join(sourceDir, counterpartFileName))) {
    throw new Error(
      `Failed to read the progress icon '${fileName}'. A progress icon is a pair, so it also needs '${counterpartFileName}'.`,
    );
  }
}

// sorted so that which tile a duplicate redirects to doesn't depend on the order the
// file system happens to list the icons in
for (const fileName of fs.readdirSync(sourceDir).sort()) {
  const { iconName, method } = parseIconFileName(fileName);
  const iconPath = path.join(sourceDir, fileName);

  switch (method) {
    case "static":
      await writeIconTiles(iconName, await readImg(iconPath));
      break;

    case "progress_right_start":
      await writeProgressIcon(iconName, "right");
      break;

    case "progress_up_start":
      await writeProgressIcon(iconName, "up");
      break;

    // the start half of the pair generates both, so these only have to be accounted for
    case "progress_right_end":
      requireCounterpart(fileName, iconName, "progress_right_start");
      break;

    case "progress_up_end":
      requireCounterpart(fileName, iconName, "progress_up_start");
      break;
  }
}

addItemTextureData(textureData);

fs.writeFileSync(
  "BP/scripts/tiled_icons.js",
  "export const TRANSPARENT_ICON_TILES=new Set(" +
    JSON.stringify(transparentTiles) +
    ");export const ICON_TILE_REDIRECTS=" +
    JSON.stringify(tileRedirects),
);
