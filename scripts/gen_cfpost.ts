import * as fs from "fs";

const NAMESPACE = "fluffyalien_energistics";

const CONTENT_BEGINNING = `
<p>
Expands Bedrock with energistics! Adds many machines to Minecraft, with custom UI. Powered by Bedrock Energistics Core.
</p>

<h2>
Beware! This add-on is in a beta stage. Minor updates may contain breaking changes!
</h2>
<h2>
Requires Bedrock Energistics Core v0.4.x
</h2>
<ul>
  <li><a href="https://www.curseforge.com/minecraft-bedrock/addons/bedrock-energistics-core">Download Bedrock Energistics Core from CurseForge</a></li>
  <li><a href="https://mcpedl.com/bedrock-energistics-core">Download Bedrock Energistics Core from MCPEDL</a></li>
</ul>
<h2>
Requires Minecraft 1.21.4x
</h2>
`;

const CONTENT_END = `
<p><a href="https://x.com/Fluffyalien1422">Follow me on X</a></p>
<div style="display: inline-flex; align-items: center;">
  <img width="76.8px" height="48.6px" src="https://vatonage.com/wp-content/uploads/jet-engine-forms/1/2024/06/firebird_pixel_no_shield.png" />
  <span>Sponsored by <a href="https://vatonage.com">Vatonage</a></span>
</div>
`;

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

const texts = fs.readFileSync("packs/RP/texts/en_US.lang", "utf8");
const textsLines = texts.split("\n");

interface Entry {
  title: string;
  bullets: string[];
}

const entries: Record<string, Entry> = {};

function setEntryTitle(id: string, title: string): void {
  if (id in entries) {
    entries[id].title = title;
    return;
  }

  entries[id] = {
    title,
    bullets: [],
  };
}

function addBulletToEntry(
  id: string,
  bulletNum: number,
  bulletValue: string,
): void {
  if (id in entries) {
    entries[id].bullets[bulletNum] = bulletValue;
    return;
  }

  const bullets = [];
  bullets[bulletNum] = bulletValue;

  entries[id] = {
    title: "NO TITLE",
    bullets,
  };
}

for (const line of textsLines) {
  const [key, value] = line.split(/=(.*)/);
  if (!key.startsWith(`${NAMESPACE}.ui.tutorialBook.entry.`)) {
    continue;
  }

  const [entryId, entrySubKey] = key
    .slice(`${NAMESPACE}.ui.tutorialBook.entry.`.length)
    .split(".");

  if (entrySubKey === "title") {
    setEntryTitle(entryId, value);
    continue;
  }

  const bulletNum = Number(entrySubKey.slice("bullet".length));
  addBulletToEntry(entryId, bulletNum, value);
}

fs.writeFileSync(
  "cfpost.html",
  CONTENT_BEGINNING +
    Object.values(entries)
      .map(
        (entry) =>
          `<h2>${htmlEscape(entry.title)}</h2><div class="spoiler"><ul><li>${entry.bullets.map(htmlEscape).join("</li><li>")}</li></ul></div>`,
      )
      .join("") +
    CONTENT_END,
);
