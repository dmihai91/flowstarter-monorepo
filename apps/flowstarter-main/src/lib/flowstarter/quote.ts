/**
 * The agreed project price, in one place.
 *
 * Two columns used to hold it. `setup_fee` is what the operator UI writes, in
 * major units as a float; `final_value_minor` is what every money path reads —
 * the deposit Checkout, the 20% webhook check, the unlock page. Nothing wrote
 * the second one, so an operator could set a price the payment flow could not
 * see, and a client could never pay a deposit.
 *
 * `final_value_minor` wins, because money belongs in integer minor units:
 * Stripe takes minor units and `depositAmountMinor`/`balanceAmountMinor` are
 * built to split them without losing a cent. `setup_fee` stays readable for
 * rows written before this, which is why every read goes through
 * `quoteMinorFrom` rather than touching a column directly.
 */

/** A row carrying either representation of the quote. */
export interface QuoteBearingRow {
  final_value_minor?: number | null;
  setup_fee?: number | string | null;
}

export class InvalidQuoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidQuoteError';
  }
}

/** Above any realistic project price, and far below Stripe's own ceiling. */
const MAX_QUOTE_MINOR = 100_000_00;

/**
 * The quote in minor units. Prefers the authoritative column and falls back to
 * the legacy one so rows written before the split still price correctly.
 * Returns 0 when neither holds a usable number — callers decide whether an
 * unpriced project is an error in their context.
 */
export function quoteMinorFrom(row: QuoteBearingRow): number {
  const authoritative = row.final_value_minor;
  if (
    typeof authoritative === 'number' &&
    Number.isFinite(authoritative) &&
    authoritative > 0
  ) {
    return Math.round(authoritative);
  }
  const legacy =
    typeof row.setup_fee === 'string' ? Number(row.setup_fee) : row.setup_fee;
  if (typeof legacy === 'number' && Number.isFinite(legacy) && legacy > 0) {
    // Legacy rows stored euros as a float; round at the cent.
    return Math.round(legacy * 100);
  }
  return 0;
}

/** The same quote in major units, for display and for the invoice endpoints. */
export function quoteMajorFrom(row: QuoteBearingRow): number {
  return quoteMinorFrom(row) / 100;
}

/**
 * Parses an operator's input (euros, as typed) into the stored minor units.
 * Rejects anything that is not a positive, finite, sane amount rather than
 * silently coercing it to 0 the way `Number(x) || 0` did.
 */
export function parseQuoteInputToMinor(input: unknown): number {
  const raw =
    typeof input === 'string' ? input.trim().replace(',', '.') : input;
  const major = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(major)) {
    throw new InvalidQuoteError('Project value must be a number');
  }
  if (major < 0) {
    throw new InvalidQuoteError('Project value cannot be negative');
  }
  const minor = Math.round(major * 100);
  if (minor > MAX_QUOTE_MINOR) {
    throw new InvalidQuoteError('Project value is above the allowed maximum');
  }
  return minor;
}
