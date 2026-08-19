import {
  MachineDefinition,
  RegisteredStorageType,
  StandardStorageCategory,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent, Player, system } from "@minecraft/server";
import {
  CustomForm,
  ObservableBoolean,
  ObservableUIRawMessage,
  UIRawMessage,
} from "@minecraft/server-ui";
import { blockLocationToUid } from "../utils/location";
import { formatAmount, formatRate } from "../utils/format";
import { logWarn } from "../log";

const TICKS_PER_SECOND = 20;

/** The prefix of every lang key this readout uses. */
const LANG = "fluffyalien_energistics.ui.networkMonitor";

/** How much history the readout averages over. */
const WINDOW_SECONDS = 10;
const WINDOW_TICKS = WINDOW_SECONDS * TICKS_PER_SECOND;

/**
 * How long a network is remembered after its last allocation.
 * @remarks
 * A network only allocates while something is flowing on it, so there is no
 * event to tell the monitor that one went quiet or was disconnected. A network
 * that stops allocating is held long enough to be reported as idle, then
 * dropped.
 */
const STALE_TICKS = 30 * TICKS_PER_SECOND;

/** How often an open readout recomputes itself. */
const REFRESH_TICKS = 4;

/**
 * One completed allocation on one network.
 */
interface AllocationSample {
  /**
   * Everything the network had available. This is new generation plus every
   * sender's reserve, which the allocator re-offers each allocation and takes
   * back afterwards, so it is a pool size rather than a rate of production.
   */
  available: number;
  /** What no device took, and so went back into the senders' reserves. */
  unclaimed: number;
  tick: number;
}

/** The recent allocation history of one network. */
interface NetworkHistory {
  /** Allocations inside the averaging window, oldest first. */
  samples: AllocationSample[];
  /**
   * When this network last allocated. Kept separately from the samples, which
   * empty out once the network goes quiet, because how long ago that was is
   * what decides whether the network is idle or gone.
   */
  lastAllocationTick: number;
}

/** Keyed by storage type ID. */
type MonitorData = Map<string, NetworkHistory>;

/** Keyed by block UID (see {@link blockLocationToUid}). */
const networkDataMap = new Map<string, MonitorData>();

/**
 * Drops samples that have aged out of the averaging window.
 * @remarks
 * Called both on insert, so the history stays bounded whether or not anyone
 * reads it, and on read, since a network that stops allocating stops inserting
 * and would otherwise keep reporting whatever it was doing when it stopped.
 */
function pruneSamples(samples: AllocationSample[], currentTick: number): void {
  const oldestKeptTick = currentTick - WINDOW_TICKS;

  let expired = 0;
  while (expired < samples.length && samples[expired].tick < oldestKeptTick) {
    expired++;
  }

  if (expired) samples.splice(0, expired);
}

export const networkMonitorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:network_monitor",
  },
  events: {
    onNetworkAllocationCompleted(e) {
      const uid = blockLocationToUid(e.blockLocation);

      let data = networkDataMap.get(uid);
      if (!data) {
        data = new Map();
        networkDataMap.set(uid, data);
      }

      const sample: AllocationSample = {
        available: e.allocationData.before,
        unclaimed: e.allocationData.after,
        tick: system.currentTick,
      };

      const history = data.get(e.network.ioType.id);
      if (history) {
        history.samples.push(sample);
        history.lastAllocationTick = sample.tick;
        pruneSamples(history.samples, sample.tick);
      } else {
        data.set(e.network.ioType.id, {
          samples: [sample],
          lastAllocationTick: sample.tick,
        });
      }
    },
  },
};

/** The formatting code a readout line is written in. */
const BODY_CODE = "§7";

/** The formatting code for a value called out inside a line. */
const VALUE_CODE = "§f";

/** The formatting code for a network's name, which heads its line. */
const NAME_CODE = "§l§f";

/** The formatting code for text that should recede: notes, idle networks. */
const MUTED_CODE = "§8";

/**
 * Applies a formatting code to a message.
 * @remarks
 * Formatting codes are applied here rather than written into the lang file, so
 * that translated strings stay plain text.
 */
function formatted(code: string, message: UIRawMessage): UIRawMessage {
  return { rawtext: [{ text: code }, message] };
}

/**
 * Adds a blank line ahead of a label or header, which the form otherwise sets
 * hard against whatever precedes it.
 * @remarks
 * The blank line leads rather than trails so that the first row under a section
 * header is separated from it, and so that a section header is separated from
 * the last row of the section before it. It belongs to the component rather
 * than to a separate spacer so that it comes and goes with what it spaces -
 * rows and headers are hidden individually, and a spacer left behind by a
 * hidden one would show as a gap.
 */
function spaced(message: UIRawMessage): UIRawMessage {
  return { rawtext: [{ text: "\n" }, message] };
}

/**
 * Adds the space that follows a substitution in its lang string.
 * @remarks
 * A space written directly after `%s` is dropped when the substitution is made,
 * so any value with text after it has to carry its own trailing space. The
 * space is left in the lang strings as well, both because they would otherwise
 * read as though the words run together and because it is what a translator
 * would write; only one of the two survives.
 *
 * Only for values that carry no formatting of their own - see
 * {@link substitution} for the ones that do.
 */
function spaceAfter(value: string): UIRawMessage {
  return { text: value + " " };
}

/**
 * A figure substituted into a lang string, picked out from the wording around
 * it and handing the line back to {@link BODY_CODE} afterwards.
 * @remarks
 * The trailing space goes *inside* the formatted run, ahead of the restoring
 * code rather than after it. A space that lands directly after a formatting
 * code is dropped before it reaches the screen, so a figure written the other
 * way round renders hard against the word after it (`0in reserves`). Values
 * with no formatting of their own are unaffected, which is what narrows this to
 * the code rather than to the substitution.
 * @param trailingSpace Whether a word follows this figure in the lang string.
 */
function substitution(
  code: string,
  message: UIRawMessage,
  trailingSpace: boolean,
): UIRawMessage {
  const rawtext: UIRawMessage[] = [{ text: code }, message];
  if (trailingSpace) rawtext.push({ text: " " });
  rawtext.push({ text: BODY_CODE });
  return { rawtext };
}

/**
 * Joins messages onto consecutive lines.
 * @remarks
 * Each newline follows the previous message's own text rather than a formatting
 * code, for the reason given on {@link substitution}.
 */
function lines(...messages: UIRawMessage[]): UIRawMessage {
  const rawtext: UIRawMessage[] = [];

  for (const message of messages) {
    if (rawtext.length) rawtext.push({ text: "\n" });
    rawtext.push(message);
  }

  return { rawtext };
}

/** The display metadata of one storage type. */
interface StorageTypeInfo {
  id: string;
  /** Display name, title-cased from the storage type's registered name. */
  name: string;
  category: string;
}

/** What one row of the readout reports. */
interface NetworkReadout {
  info: StorageTypeInfo;
  /**
   * Whether the network had nothing at all to move over the window. Reported
   * rather than inferred from the figures below, which are rounded.
   */
  idle: boolean;
  /** Units per second that actually moved from one device to another. */
  transferredPerSecond: number;
  /** Average amount per allocation that no device took, left in reserves. */
  reserves: number;
}

/**
 * Reduces a network's recent allocations to what the readout reports.
 * @remarks
 * What was available and what stayed in reserves are pool sizes, so they are
 * averaged. What moved is a flow, so it becomes a rate: totalled over the window
 * and divided by how long that window actually covers, which is why samples
 * carry a tick.
 *
 * Expects `samples` to already be pruned to the window. An empty set of samples
 * reports idle, which is also the right answer for a network that had nothing
 * available.
 */
function readNetwork(
  samples: AllocationSample[],
  currentTick: number,
): Omit<NetworkReadout, "info"> {
  let availableTotal = 0;
  let unclaimedTotal = 0;
  for (const sample of samples) {
    availableTotal += sample.available;
    unclaimedTotal += sample.unclaimed;
  }

  if (!availableTotal) {
    return { idle: true, transferredPerSecond: 0, reserves: 0 };
  }

  // Measure the window from the oldest sample still held to now, so the rate
  // falls away when allocations stop instead of freezing at its last value. The
  // floor keeps a monitor that has only just started collecting from dividing a
  // burst of throughput by a couple of ticks.
  const elapsedTicks = Math.max(
    currentTick - samples[0].tick,
    TICKS_PER_SECOND,
  );

  return {
    idle: false,
    transferredPerSecond:
      (availableTotal - unclaimedTotal) / (elapsedTicks / TICKS_PER_SECOND),
    reserves: unclaimedTotal / samples.length,
  };
}

/**
 * The categories the add-on knows about, in the order their sections appear.
 * Categories registered by other packs follow these, alphabetically.
 */
const CATEGORY_ORDER: string[] = [
  StandardStorageCategory.Energy,
  StandardStorageCategory.Gas,
  StandardStorageCategory.Fluid,
];

interface CategoryGroup {
  category: string;
  types: StorageTypeInfo[];
}

/**
 * Storage type names are registered lower case (`liquid experience`), but each
 * row heads a line, so title case reads better there.
 */
function titleCase(text: string): string {
  return text.replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

async function getStorageTypeInfo(): Promise<StorageTypeInfo[]> {
  const ids = await RegisteredStorageType.getAllIds();
  const types = await Promise.all(
    ids.map((id) => RegisteredStorageType.get(id)),
  );

  return types
    .filter((type): type is RegisteredStorageType => type !== undefined)
    .map((type) => ({
      id: type.id,
      name: titleCase(type.name),
      category: type.category,
    }));
}

function groupByCategory(types: StorageTypeInfo[]): CategoryGroup[] {
  const groups = new Map<string, StorageTypeInfo[]>();

  for (const type of types) {
    const existing = groups.get(type.category);
    if (existing) {
      existing.push(type);
    } else {
      groups.set(type.category, [type]);
    }
  }

  return [...groups]
    .map(([category, categoryTypes]) => ({ category, types: categoryTypes }))
    .sort((a, b) => {
      const rankA = CATEGORY_ORDER.indexOf(a.category);
      const rankB = CATEGORY_ORDER.indexOf(b.category);

      if (rankA === -1 || rankB === -1) {
        if (rankA !== -1) return -1;
        if (rankB !== -1) return 1;
        return a.category < b.category ? -1 : a.category > b.category ? 1 : 0;
      }

      return rankA - rankB;
    });
}

function categoryMessage(category: string): UIRawMessage {
  return CATEGORY_ORDER.includes(category)
    ? { translate: `${LANG}.category.${category}` }
    : { text: titleCase(category) };
}

/**
 * One figure and the wording that names it, as its own line. The figure leads
 * the line, so nothing has to sit between it and the formatting around it.
 */
function figureLine(
  langKey: string,
  figure: string,
  trailingSpace: boolean,
): UIRawMessage {
  return {
    translate: langKey,
    with: {
      rawtext: [substitution(VALUE_CODE, { text: figure }, trailingSpace)],
    },
  };
}

function rowMessage(readout: NetworkReadout): UIRawMessage {
  const name = formatted(NAME_CODE, { text: readout.info.name });

  if (readout.idle) {
    return spaced(
      lines(name, formatted(MUTED_CODE, { translate: `${LANG}.row.idle` })),
    );
  }

  return spaced(
    lines(
      name,
      // No trailing space on the rate: '/s' follows the figure directly.
      figureLine(
        `${LANG}.row.transferred`,
        formatRate(readout.transferredPerSecond),
        false,
      ),
      figureLine(`${LANG}.row.reserves`, formatAmount(readout.reserves), true),
    ),
  );
}

/**
 * One row of the readout. Rows are created up front - one per registered
 * storage type in its category's section, in the same order - because a form's
 * layout is fixed once shown; what varies is each row's text and whether it is
 * visible. A storage type's row is always at its own index in {@link
 * GroupSlots.rows}.
 */
interface RowSlot {
  text: ObservableUIRawMessage;
  visible: ObservableBoolean;
}

interface GroupSlots {
  types: StorageTypeInfo[];
  headerVisible: ObservableBoolean;
  rows: RowSlot[];
}

async function showReadout(player: Player, uid: string): Promise<void> {
  const groups = groupByCategory(await getStorageTypeInfo());

  const intro = new ObservableUIRawMessage({ text: "" });
  const idleSummary = new ObservableUIRawMessage({ text: "" });
  const idleSummaryVisible = new ObservableBoolean(false);
  const showIdle = new ObservableBoolean(false, { clientWritable: true });

  const form = new CustomForm(player, {
    translate: "tile.fluffyalien_energistics:network_monitor.name",
  })
    .label(intro)
    .label(spaced(formatted(BODY_CODE, { translate: `${LANG}.legend` })))
    .label(
      spaced(
        formatted(MUTED_CODE, {
          translate: `${LANG}.window`,
          with: { rawtext: [spaceAfter(WINDOW_SECONDS.toString())] },
        }),
      ),
    )
    .divider();

  const groupSlots: GroupSlots[] = groups.map((group) => {
    const headerVisible = new ObservableBoolean(false);
    form.header(spaced(categoryMessage(group.category)), {
      visible: headerVisible,
    });

    const rows = group.types.map(() => {
      const text = new ObservableUIRawMessage({ text: "" });
      const visible = new ObservableBoolean(false);
      form.label(text, { visible });
      return { text, visible };
    });

    return { types: group.types, headerVisible, rows };
  });

  form
    .divider()
    .label(idleSummary, { visible: idleSummaryVisible })
    .toggle({ translate: `${LANG}.showIdle` }, showIdle)
    .closeButton();

  function update(): void {
    const currentTick = system.currentTick;
    const data = networkDataMap.get(uid);

    if (data) {
      for (const [typeId, history] of data) {
        // Drop a network that hasn't allocated in a long time: that is the only
        // sign the monitor gets that it was disconnected. Ones that stopped more
        // recently stay, with their samples aged out, so they read as idle.
        if (currentTick - history.lastAllocationTick > STALE_TICKS) {
          data.delete(typeId);
          continue;
        }

        pruneSamples(history.samples, currentTick);
      }
    }

    const showingIdle = showIdle.getData();
    const allReadouts: NetworkReadout[] = [];

    for (const group of groupSlots) {
      // Each network keeps the same slot for as long as the readout is open, so
      // a row never changes place under someone reading it. All that varies is
      // its text and whether it is shown.
      let shownCount = 0;

      for (let i = 0; i < group.types.length; i++) {
        const info = group.types[i];
        const row = group.rows[i];

        const history = data?.get(info.id);
        const readout = history
          ? { info, ...readNetwork(history.samples, currentTick) }
          : undefined;

        if (readout) allReadouts.push(readout);

        if (readout && (showingIdle || !readout.idle)) {
          row.text.setData(rowMessage(readout));
          row.visible.setData(true);
          shownCount++;
        } else {
          row.visible.setData(false);
        }
      }

      group.headerVisible.setData(shownCount > 0);
    }

    intro.setData(
      spaced(
        allReadouts.length
          ? {
              translate: `${LANG}.intro`,
              with: { rawtext: [spaceAfter(allReadouts.length.toString())] },
            }
          : { translate: `${LANG}.intro.none` },
      ),
    );

    const idleCount = allReadouts.filter((readout) => readout.idle).length;

    idleSummary.setData(
      spaced(
        formatted(MUTED_CODE, {
          translate: `${LANG}.idleSummary`,
          with: [idleCount.toString()],
        }),
      ),
    );
    idleSummaryVisible.setData(idleCount > 0 && !showingIdle);
  }

  update();

  const refreshId = system.runInterval(update, REFRESH_TICKS);
  const showIdleListener = showIdle.subscribe(update);

  try {
    await form.show();
  } finally {
    system.clearRun(refreshId);
    showIdle.unsubscribe(showIdleListener);
  }
}

export const networkMonitorComponent: BlockCustomComponent = {
  onBreak(e) {
    networkDataMap.delete(blockLocationToUid(e.block));
  },
  onPlayerInteract(e) {
    const player = e.player;
    if (!player) return;

    const uid = blockLocationToUid(e.block);

    // Building and showing a form isn't allowed from a block component
    // callback, which runs in restricted-execution mode.
    system.run(() => {
      showReadout(player, uid).catch((error: unknown) => {
        logWarn(`Failed to show the network monitor readout: ${String(error)}`);
      });
    });
  },
};
