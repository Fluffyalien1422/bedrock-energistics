import * as fs from "fs";

const BP_HEADER_UUID = "34dbc9d1-1e2b-421e-a816-d0418896b665";
const BP_DATA_UUID = "5243f317-00c6-4405-8d41-dbf6c42ec2d4";
const BP_SCRIPT_UUID = "9ff133e0-1754-4ac9-8976-8c212f90577d";

const RP_HEADER_UUID = "92ebebbb-78b7-4e3a-90ce-9fdb394b3a48";
const RP_RESOURCES_UUID = "e258f0e1-7767-4d49-bb2c-f24791b16500";

type VersionTuple = [number, number, number];
interface SimpleManifest {
  version: VersionTuple;
  minEngineVersion: VersionTuple;
  scriptModules: { name: string; version: string }[];
}

const simpleManifest = JSON.parse(
  fs.readFileSync("data/simple_manifest.json", "utf8"),
) as SimpleManifest;

fs.writeFileSync(
  "BP/manifest.json",
  JSON.stringify({
    format_version: 2,
    header: {
      name: "pack.name",
      description: "pack.description",
      min_engine_version: simpleManifest.minEngineVersion,
      uuid: BP_HEADER_UUID,
      version: simpleManifest.version,
    },
    modules: [
      {
        type: "data",
        uuid: BP_DATA_UUID,
        version: [1, 0, 0],
      },
      {
        type: "script",
        language: "javascript",
        uuid: BP_SCRIPT_UUID,
        entry: "scripts/__bundle.js",
        version: [1, 0, 0],
      },
    ],
    dependencies: [
      {
        uuid: RP_HEADER_UUID,
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
  "RP/manifest.json",
  JSON.stringify({
    format_version: 2,
    header: {
      name: "pack.name",
      description: "pack.description",
      pack_scope: "world",
      min_engine_version: simpleManifest.minEngineVersion,
      uuid: RP_HEADER_UUID,
      version: simpleManifest.version,
    },
    modules: [
      {
        type: "resources",
        uuid: RP_RESOURCES_UUID,
        version: [1, 0, 0],
      },
    ],
    dependencies: [
      {
        uuid: BP_HEADER_UUID,
        version: simpleManifest.version,
      },
    ],
    capabilities: ["pbr"],
  }),
);
