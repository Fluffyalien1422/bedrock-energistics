import * as fs from "fs";
import * as jsonc from "jsonc-parser";

/**
 * The namespace of this pack, used to build the ID of everything the filters generate.
 * @remarks
 * Change this and {@link TEXTURE_BASE_PATH} to reuse the filters in another pack.
 */
export const NAMESPACE = "fluffyalien_energistics";

/**
 * The directory generated textures are written to, relative to the resource pack, with
 * a trailing slash.
 * @see {@link NAMESPACE}
 */
export const TEXTURE_BASE_PATH = "textures/fluffyalien/energistics/";

export type ItemTextureData = Record<string, { textures: string }>;

export function addItemTextureData(textureData: ItemTextureData): void {
  const itemTexturePath = "RP/textures/item_texture.json";
  fs.writeFileSync(
    itemTexturePath,
    JSON.stringify({
      texture_data: {
        ...(
          jsonc.parse(fs.readFileSync(itemTexturePath, "utf8")) as {
            texture_data: ItemTextureData;
          }
        ).texture_data,
        ...textureData,
      },
    }),
  );
}
