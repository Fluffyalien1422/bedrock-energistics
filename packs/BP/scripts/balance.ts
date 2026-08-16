/**
 * Every rate, timing, and cost in the add-on, in one place.
 *
 * ## Units
 *
 * Machine blocks tick on `minecraft:tick` with `interval_range [10, 10]`, so one
 * machine tick is 10 game ticks (0.5s). **Every rate here is per machine tick**;
 * double it for per second. Changing a block's `interval_range` silently changes
 * what all of these mean, so keep every machine on the 10 tick cadence.
 *
 * ## The base unit
 *
 * **One coal is 800 energy.** Everything else is derived from it. The powered
 * furnace costs 50 energy per item, so one coal smelts 16 items in 5s each,
 * against vanilla's 8 items at 10s each.
 *
 * ## Closed loops
 *
 * A producer that invents a storage type out of nothing must cost more energy per
 * unit than a generator gives back for it, or the pair is an infinite energy
 * fountain. The ledger, as energy in per unit against energy back per unit:
 *
 * | Loop                        | In | Out | Ratio | Verdict            |
 * | --------------------------- | -- | --- | ----- | ------------------ |
 * | Pump -> water generator     | 6  | 3   | 0.50x | closed             |
 * | Pump -> lava generator      | 6  | 5   | 0.83x | closed             |
 * | Crucible -> lava generator  | 2  | 5   | 2.5x  | open, by design    |
 * | Oil extractor -> oil gen    | 5  | 10  | 2.0x  | open, by design    |
 * | Ammonia chain -> ammonia gen| 50 | 90  | 1.8x  | open, by design    |
 *
 * The three open routes are deliberate. The crucible consumes an item
 * (cobblestone), so it is a renewable item to power route like the coal and
 * organic generators rather than a loop. Oil and ammonia are the payoffs for
 * reaching the diamond and plastic tiers.
 *
 * Anything added here that produces a storage type from nothing has to be checked
 * against this table.
 */

/**
 * Max amount of each storage type in a machine. Mirrors the Core API default.
 *
 * @remarks
 * A storage bar is 4 slots of 16 segments, so this divides into 64 pips of 100
 * units each. Values that are not a multiple of 64 make the bar read unevenly.
 */
export const MAX_MACHINE_STORAGE = 6400;

// #region Generators

/** Solar panel output during the day. */
export const SOLAR_PANEL_ENERGY_GENERATION = 5;

export const ORGANIC_GENERATOR_ENERGY_PER_PROGRESS = 10;
/** 10 * 26 = 260 energy per seed, over 13s. */
export const ORGANIC_GENERATOR_SEED_MAX_PROGRESS = 26;
/** 10 * 38 = 380 energy per sapling, over 19s. */
export const ORGANIC_GENERATOR_SAPLING_MAX_PROGRESS = 38;

/** 16 * 50 = 800 energy per coal, over 25s. This is the pack's base unit. */
export const COAL_GENERATOR_ENERGY_PER_PROGRESS = 16;
export const COAL_GENERATOR_MAX_PROGRESS = 50;

/** 3 energy per water, against the pump's 6 to make it. */
export const WATER_GENERATOR_WATER_CONSUMPTION = 4;
export const WATER_GENERATOR_ENERGY_GENERATION = 12;

/** 5 energy per lava, against the pump's 6 to make it and the crucible's 2. */
export const LAVA_GENERATOR_LAVA_CONSUMPTION = 4;
export const LAVA_GENERATOR_ENERGY_GENERATION = 20;

/** 10 energy per oil, against the oil extractor's 5 to make it. */
export const OIL_GENERATOR_OIL_CONSUMPTION = 4;
export const OIL_GENERATOR_ENERGY_GENERATION = 40;

/** 90 energy per ammonia, against the ammonia chain's 50 to make it. */
export const AMMONIA_GENERATOR_AMMONIA_CONSUMPTION = 2;
export const AMMONIA_GENERATOR_ENERGY_GENERATION = 180;

// #endregion

// #region Producers and converters

/** 6 energy per fluid, more than either fluid gives back when burned. */
export const PUMP_ENERGY_CONSUMPTION = 24;
export const PUMP_FLUID_GENERATION = 4;

/** 5 energy per oil, half of what the oil generator gives back. */
export const OIL_EXTRACTOR_ENERGY_CONSUMPTION = 20;
export const OIL_EXTRACTOR_OIL_GENERATION = 4;

/** 20 energy per gas. */
export const ATMOSPHERIC_CONDENSER_ENERGY_CONSUMPTION = 40;
export const ATMOSPHERIC_CONDENSER_GAS_GENERATION = 2;

/**
 * 2 * 32 = 64 energy and one cobblestone for 32 lava, over 16s.
 *
 * @remarks
 * The lava is worth 160 energy, so each cobblestone nets 96. This is the
 * add-on's renewable item to power route, and the first number to lower if
 * cobblestone power turns out too strong: four crucibles feed one lava
 * generator, which lands the bank at roughly one coal generator.
 */
export const CRUCIBLE_ENERGY_CONSUMPTION = 2;
export const CRUCIBLE_MAX_PROGRESS = 32;
export const CRUCIBLE_LAVA_GENERATION = 32;

export const FLUID_SEPARATOR_ENERGY_CONSUMPTION = 40;
export const FLUID_SEPARATOR_FLUID_CONSUMPTION = 6;

/** With gas at 20 energy each, this works out at 50 energy per ammonia. */
export const AMMONIA_FACTORY_ENERGY_CONSUMPTION = 20;
export const AMMONIA_FACTORY_NITROGEN_CONSUMPTION = 1;
export const AMMONIA_FACTORY_HYDROGEN_CONSUMPTION = 3;
export const AMMONIA_FACTORY_AMMONIA_GENERATION = 2;

// #endregion

// #region Processors

/** 5 * 10 = 50 energy per item, over 5s. 16 items per coal, at twice vanilla's speed. */
export const POWERED_FURNACE_ENERGY_PER_PROGRESS = 5;
export const POWERED_FURNACE_MAX_PROGRESS = 10;

/** 8 * 10 = 80 energy per item, over 5s. */
export const CRUSHER_ENERGY_PER_PROGRESS = 8;
export const CRUSHER_MAX_PROGRESS = 10;

/**
 * 24 * 32 = 768 energy per item, over 16s.
 *
 * @remarks
 * Crushing cobblestone into gravel and centrifuging it is the cheapest route to
 * diamonds in the pack, so this carries the price of that rather than the loot
 * weights.
 */
export const CENTRIFUGE_ENERGY_PER_PROGRESS = 24;
export const CENTRIFUGE_MAX_PROGRESS = 32;

/**
 * 25 * 32 = 800 energy per item, over 16s.
 *
 * @remarks
 * One coal per item. At a diamond weight of 1 in 18 that is 18 coal per diamond,
 * which is the price of an ore source that takes no input at all.
 */
export const VOID_MINER_ENERGY_PER_PROGRESS = 25;
export const VOID_MINER_MAX_PROGRESS = 32;

export const BASIC_REFINERY_ENERGY_PER_PROGRESS = 6;
/** 6 * 16 = 96 energy, over 8s. */
export const BASIC_REFINERY_COAL_MAX_PROGRESS = 16;
export const BASIC_REFINERY_COAL_CARBON_CONSUMPTION = 100;
/** 6 * 32 = 192 energy, over 16s. */
export const BASIC_REFINERY_PLASTIC_MAX_PROGRESS = 32;
export const BASIC_REFINERY_PLASTIC_OIL_CONSUMPTION = 100;

// #endregion

// #region Utility

export const BLOCK_BREAKER_ENERGY_PER_BLOCK = 10;
export const BLOCK_PLACER_ENERGY_PER_BLOCK = 10;
export const ITEM_CHARGER_ENERGY_CONSUMPTION = 40;

// #endregion

// #region Storage containers

/** The battery, fluid tank, and gas canister all hold this much. */
export const ST_CONTAINER_AMOUNT_PER_STAGE = 3200;
export const ST_CONTAINER_MAX_STORAGE = ST_CONTAINER_AMOUNT_PER_STAGE * 3;
/** Nudges the visual stage up slightly early, so a nearly full stage reads as full. */
export const ST_CONTAINER_STAGE_AMOUNT_PADDING = 200;

/** How much fluid one bucket moves in or out of a fluid tank. */
export const FLUID_TANK_BUCKET_AMOUNT = 100;

// #endregion
