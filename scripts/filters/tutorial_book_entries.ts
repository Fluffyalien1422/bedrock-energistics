import * as fs from "fs";
import * as path from "path";
import { TMP_DIR } from "./common";
import { TutorialEntry } from "../../packs/BP/scripts/tutorial_book_entries";

const ENTRY_PREFIX = "fluffyalien_energistics.ui.tutorialBook.entry.";

const texts = fs.readFileSync(
  path.join(TMP_DIR, "RP/texts/en_US.lang"),
  "utf8",
);
const textsLines = texts.split("\n");

const entries: Record<string, TutorialEntry> = {};

for (const line of textsLines) {
  const key = line.split(/=(.*)/)[0];
  if (!key.startsWith(ENTRY_PREFIX)) {
    continue;
  }
  const [entryId, entrySubKey] = key.slice(ENTRY_PREFIX.length).split(".");
  if (entrySubKey === "title") {
    continue;
  }
  const bulletIndex = Number(entrySubKey.slice("bullet".length));

  if (entryId in entries) {
    entries[entryId].bullets = Math.max(
      entries[entryId].bullets,
      bulletIndex + 1,
    );
    continue;
  }

  entries[entryId] = {
    bullets: bulletIndex + 1,
  };
}

fs.writeFileSync(
  path.join(TMP_DIR, "BP/scripts/tutorial_book_entries.js"),
  "export const TUTORIAL_ENTRIES=" + JSON.stringify(entries),
);
