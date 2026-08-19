/**
 * Amounts below this are shown in full with thousands separators. At or above
 * it they are abbreviated: past four digits the exact figure isn't something a
 * player reads, and a stable width is worth more than the trailing digits.
 */
const ABBREVIATE_AT = 10_000;

/**
 * Rates below this keep a decimal place. Rounding them to a whole number turns
 * a slow trickle into either `0` or a misleadingly precise `1`.
 */
const RATE_DECIMAL_BELOW = 10;

/**
 * Inserts thousands separators. Expects a non-negative integer.
 */
function groupThousands(value: number): string {
  const digits = value.toString();

  let result = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) {
      result += ",";
    }
    result += digits[i];
  }

  return result;
}

/**
 * Formats a storage amount for display, abbreviating large values.
 * @remarks
 * Abbreviated amounts keep their trailing zeros (`14.0k`, never `14k`). These
 * figures update in place while they are on screen, and a decimal place that
 * appears and disappears as the value moves shifts everything after it on the
 * line.
 * @param amount The amount. Negative values are clamped to zero.
 */
export function formatAmount(amount: number): string {
  const rounded = Math.max(Math.round(amount), 0);

  if (rounded < ABBREVIATE_AT) {
    return groupThousands(rounded);
  }

  // Compare the rounded figure, not the raw one, so a value that only reaches
  // the next unit by rounding moves up to it rather than overflowing its own
  // (999,999 would otherwise abbreviate to '1000.0k').
  const thousands = rounded / 1000;
  if (Math.round(thousands * 10) / 10 < 1000) {
    return `${thousands.toFixed(1)}k`;
  }

  return `${(rounded / 1_000_000).toFixed(2)}M`;
}

/**
 * Formats a per-second rate for display. Unlike {@link formatAmount}, small
 * rates keep a decimal place so a slow trickle doesn't read as nothing.
 * @param perSecond The rate. Negative values are clamped to zero.
 */
export function formatRate(perSecond: number): string {
  if (perSecond <= 0) return "0.0";

  // As in formatAmount, pick the form from the rounded figure: a rate of 9.99
  // must not show as '10.0' when a rate of 10 shows as '10'.
  const rounded = Math.round(perSecond * 10) / 10;

  if (rounded < RATE_DECIMAL_BELOW) {
    // Anything that rounds away entirely is still moving, so say so rather
    // than reporting a flowing network as stopped.
    return rounded === 0 ? "<0.1" : rounded.toFixed(1);
  }

  return formatAmount(perSecond);
}
