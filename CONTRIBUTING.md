# Contributing Code

Note: This is a guide for contributing code, not issues. Report bugs and suggest
features on the [issue tracker](https://github.com/Fluffyalien1422/bedrock-energistics/issues).

## Preparing Your Environment

This project is configured for Windows 10/11 machines. If you're using another OS, it may not work properly.

### Prerequisites

Ensure you have the following programs installed and up to date:

- [VSCode](https://code.visualstudio.com/)
- [Node.js LTS and npm](https://nodejs.org/)
- [Regolith](https://bedrock-oss.github.io/regolith/)
- [Minecraft (Bedrock Edition Stable)](https://www.xbox.com/en-US/games/store/minecraft/9MVXMVT8ZKWC)

This add-on is built on [Bedrock Energistics Core](https://github.com/Fluffyalien1422/bedrock-energistics-core), so its APIs are worth reading.

### Setting Up

1. Run `npm i`
2. Run `npm i` again in the `scripts` directory

## Project Layout

| Path                        | What it is                                                                |
| --------------------------- | ------------------------------------------------------------------------- |
| `packs/BP`, `packs/RP`      | The add-on itself. `packs/BP/scripts` is its behavior pack script source. |
| `packs/BP/scripts/machines` | One file per machine, holding its definition and its block tick logic.    |
| `packs/RP/ui`               | The machine screens, one JSON UI file per machine.                        |
| `packs/data`                | Input for build filters, not shipped as-is.                               |
| `scripts`                   | Build tooling: the Regolith filters (not shipped).                        |

## Checking Your Code

To check your code before committing, run `npm run check`.

To format your code, run `npm run fmt`.

Test your changes in Minecraft before pushing.

## Building Your Code

To build your code, run `regolith run`.

| Command                        | What it does                                                     |
| ------------------------------ | ---------------------------------------------------------------- |
| `regolith run`                 | Builds and exports to Minecraft's development pack folders.      |
| `regolith run dev_localexport` | Exports to the project's `build` directory instead of Minecraft. |
| `regolith run prod`            | A production build, minified down to the script bundle.          |

The behavior pack scripts are bundled from `packs/BP/scripts/index.ts`.

## Adding a Machine

A machine is spread across a few places:

1. `packs/BP/scripts/machines/<machine>.ts` — its `MachineDefinition` and its `BlockCustomComponent`.
2. `packs/BP/scripts/register_machines.ts` — register the definition.
3. `packs/BP/scripts/custom_components.ts` — wire up the component.
4. `packs/BP/blocks/<machine>.json` — the block, including its `fluffyalien_energisticscore:io.*` tags, which decide what it can send and receive.
5. `packs/data/machine_entities/<machine>.json` — its entity, whose `inventorySize` must cover every UI slot.
6. `packs/RP/ui/fluffyalien/energistics/<machine>.json` — its screen.
7. `packs/RP/ui/chest_screen.json` — map the machine's ID to `<machine>.root`.
8. `packs/RP/ui/_ui_defs.json` — list the new screen file.
9. `packs/RP/texts/en_US.lang` — its name, and a tutorial book entry.

## UI Design Language

Every machine screen follows the same grammar so that a player who has learned
one machine can read the rest. `solar_panel.json` and `crusher.json` are the
files to copy from.

### Structure

A screen extends the Core templates and holds its content in a second panel:

```json
{
  "namespace": "fluffyalien_energistics:<machine>",
  "root@fluffyalien_energisticscore:common_v2.screen_template": {
    "$content_ref": "fluffyalien_energistics:<machine>.content"
  },
  "content@fluffyalien_energisticscore:common_v2.content_template": {
    "controls": [...]
  }
}
```

The root (screen) element should be named `root`.

### Layout

**Inputs go on the left, outputs on the right, and the indicator between them.**
Energy is an input for a machine that consumes it and an output for a generator,
so it sits on whichever side it belongs to.

The content panel is 180x78. Elements are centred on the storage bar's vertical
midpoint, y=44, so things of different heights still line up:

| Element      | Size         | y   |
| ------------ | ------------ | --- |
| Storage bar  | 16x64        | 12  |
| Item slot    | 18x18        | 35  |
| Working icon | 16x16        | 36  |
| Long arrow   | 22x11 of art | 38  |
| Plus icon    | 12x12        | 38  |

A transfer indicator stacks a double arrow and the icon below it, so it goes at
`"50%-8px"` and positions the two itself. Fuel burners use one as well, with the
flame in place of the working icon.

Horizontally, adjacent storage bars sit 24px apart, and 36px apart when a plus
icon goes between them, which gives the plus 4px of clearance on each side. The
first element on the left starts at x=8, and the last on the right ends at x=172.

The indicator is centred **in the gap between the inputs and the outputs**, not
in the panel. Those are only the same thing when the two sides happen to be
balanced.

### Slots

Item slots are colored by direction, via `$background_images`:

| Direction | Background                                                  |
| --------- | ----------------------------------------------------------- |
| Input     | `fluffyalien_energistics:common.blue_item_slot_image_panel` |
| Output    | `fluffyalien_energistics:common.red_item_slot_image_panel`  |
| Both      | none — leave the default slot                               |

A blue plus goes between grouped inputs and a red plus between grouped outputs,
to say that both are needed or both are produced. There is no plus where a side
has only one thing on it.

### Indicators

Which indicator a machine gets depends on what it has to say:

| Machine                                         | Indicator                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Converts one storage type into another per tick | `createTransferIndicator` — animated double arrow with a working icon below it |
| Has a real progress value                       | `createProgressArrow` — long arrow that fills as it goes                       |
| Consumes without producing anything shown       | `createWorkingIcon` — the working icon on its own                              |
| Burns fuel                                      | The double arrow with a flame below it, in place of the working icon           |
| Only stores                                     | Nothing                                                                        |

A machine never gets both a progress arrow and a working icon; the arrow already
says whether it's running.

These helpers live in `packs/BP/scripts/utils/ui.ts` and each has a JSON UI
counterpart in `packs/RP/ui/fluffyalien/energistics/common.json`.

### Tiled Icons

Some large UI icons are split into tiles. The `tiled_icons` filter generates them
from the images in `packs/data/tiled_icons`, each named `<name>.<method>.png`:

| Method                           | What it produces                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `static`                         | One icon.                                                                                                  |
| `progress_start`, `progress_end` | A pair, sharing a name, that becomes one icon per frame as the end image is revealed over the start image. |

## Before Submitting a PR

- Your code is formatted (`npm run fmt`) and checked (`npm run check`).
- You have tested your changes in Minecraft.
- New machines are wired up everywhere listed in [Adding a Machine](#adding-a-machine).
- New screens follow the [UI design language](#ui-design-language).
