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

export function calculateFromExclusive(amount: number, rate: number): GstResult {
  const gst = roundCurrency(amount * rate);
  return {
    exclusive: roundCurrency(amount),
    gst,
    inclusive: roundCurrency(amount + gst),
  };
}

export function calculateFromInclusive(amount: number, rate: number): GstResult {
  const exclusive = roundCurrency(amount / (1 + rate));
  const gst = roundCurrency(amount - exclusive);
  return {
    exclusive,
    gst,
    inclusive: roundCurrency(amount),
  };
}

export function determineGstFromAmount(
  amount: number,
  rate: number,
  mode: 'exclusive' | 'inclusive',
): GstResult {
  return mode === 'exclusive'
    ? calculateFromExclusive(amount, rate)
    : calculateFromInclusive(amount, rate);
}
