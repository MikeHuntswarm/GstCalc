export interface GstResult {
  exclusive: number;
  gst: number;
  inclusive: number;
}

function roundCurrency(value: number) {
  const factor = 100;
  let scaled = Math.abs(value) * factor;

  if (value < 0) {
    const fraction = scaled - Math.floor(scaled);
    const threshold = 1e-10;

    if (Math.abs(fraction - 0.5) < threshold) {
      scaled += threshold;
    }
  }

  const roundedCents = Math.round(scaled);
  const result = (value < 0 ? -1 : 1) * (roundedCents / factor);
  return result === 0 ? 0 : result;
}

/**
 * Calculates GST results when the given amount is exclusive of GST.
 *
 * @param amount The amount exclusive of GST. Must be a valid number.
 * @param rate The GST rate (e.g., 0.10 for 10%). Must be a valid non-negative number.
 * @returns An object containing the exclusive amount, GST amount, and inclusive amount.
 * @throws {Error} If `amount` or `rate` are not valid numbers, or if `rate` is negative.
 */
export function calculateFromExclusive(amount: number, rate: number): GstResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount: amount must be a valid number.');
  }
  if (typeof rate !== 'number' || isNaN(rate) || rate < 0) {
    throw new Error('Invalid rate: rate must be a valid non-negative number.');
  }

  const gst = roundCurrency(amount * rate);
  return {
    exclusive: roundCurrency(amount),
    gst,
    inclusive: roundCurrency(amount + gst),
  };
}

/**
 * Calculates GST results when the given amount is inclusive of GST.
 *
 * @param amount The amount inclusive of GST. Must be a valid number.
 * @param rate The GST rate (e.g., 0.10 for 10%). Must be a valid non-negative number.
 * @returns An object containing the exclusive amount, GST amount, and inclusive amount.
 * @throws {Error} If `amount` or `rate` are not valid numbers, or if `rate` is negative.
 */
export function calculateFromInclusive(amount: number, rate: number): GstResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount: amount must be a valid number.');
  }
  if (typeof rate !== 'number' || isNaN(rate) || rate < 0) {
    throw new Error('Invalid rate: rate must be a valid non-negative number.');
  }

  const exclusive = roundCurrency(amount / (1 + rate));
  const gst = roundCurrency(amount - exclusive);
  return {
    exclusive,
    gst,
    inclusive: roundCurrency(amount),
  };
}

/**
 * Determines the GST calculation based on the provided amount, rate, and mode.
 *
 * @param amount The amount to calculate GST for. Must be a valid number.
 * @param rate The GST rate (e.g., 0.10 for 10%). Must be a valid non-negative number.
 * @param mode The calculation mode, either 'exclusive' or 'inclusive'.
 * @returns An object containing the exclusive amount, GST amount, and inclusive amount.
 * @throws {Error} If `amount` or `rate` are not valid numbers, if `rate` is negative, or if `mode` is not 'exclusive' or 'inclusive'.
 */
export function determineGstFromAmount(
  amount: number,
  rate: number,
  mode: 'exclusive' | 'inclusive',
): GstResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount: amount must be a valid number.');
  }
  if (typeof rate !== 'number' || isNaN(rate) || rate < 0) {
    throw new Error('Invalid rate: rate must be a valid non-negative number.');
  }
  if (mode !== 'exclusive' && mode !== 'inclusive') {
    throw new Error('Invalid mode: mode must be either "exclusive" or "inclusive".');
  }

  return mode === 'exclusive'
    ? calculateFromExclusive(amount, rate)
    : calculateFromInclusive(amount, rate);
}
