import * as fs from "fs";
import * as path from "path";
import * as simpleManifest from "@/packs/data/simple_manifest.json";
import { TMP_DIR } from "./common";

fs.writeFileSync(
  path.join(TMP_DIR, "BP/manifest.json"),
  JSON.stringify({
    format_version: 2,
    header: {
      name: "pack.name",
      description: "pack.description",
      min_engine_version: simpleManifest.minEngineVersion,
      uuid: simpleManifest.uuids.bp.header,
      version: simpleManifest.version,
    },
    modules: [
      {
        type: "data",
        uuid: simpleManifest.uuids.bp.data,
        version: [1, 0, 0],
      },
      {
        type: "script",
        language: "javascript",
        uuid: simpleManifest.uuids.bp.script,
        entry: "scripts/__bundle.js",
        version: [1, 0, 0],
      },
    ],
    dependencies: [
      {
        uuid: simpleManifest.uuids.rp.header,
        version: simpleManifest.version,
      },
      ...simpleManifest.scriptModules.map((scriptMod) => ({
        module_name: scriptMod.name,
        version: scriptMod.version,
      })),
    ],
  }),
);

fs.writeFileSync(
  path.join(TMP_DIR, "RP/manifest.json"),
  JSON.stringify({
    format_version: 2,
    header: {
      name: "pack.name",
      description: "pack.description",
      pack_scope: "world",
      min_engine_version: simpleManifest.minEngineVersion,
      uuid: simpleManifest.uuids.rp.header,
      version: simpleManifest.version,
    },
    modules: [
      {
        type: "resources",
        uuid: simpleManifest.uuids.rp.resources,
        version: [1, 0, 0],
      },
    ],
    dependencies: [
      {
        uuid: simpleManifest.uuids.bp.header,
        version: simpleManifest.version,
      },
    ],
  }),
);
