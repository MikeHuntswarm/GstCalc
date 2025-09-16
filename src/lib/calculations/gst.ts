export interface GstResult {
  exclusive: number;
  gst: number;
  inclusive: number;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateFromExclusive(amount: number, rate: number): GstResult {
  const gst = roundCurrency(amount * rate);
  return {
    exclusive: roundCurrency(amount),
    gst,
    inclusive: roundCurrency(amount + gst)
  };
}

export function calculateFromInclusive(amount: number, rate: number): GstResult {
  const exclusive = roundCurrency(amount / (1 + rate));
  const gst = roundCurrency(amount - exclusive);
  return {
    exclusive,
    gst,
    inclusive: roundCurrency(amount)
  };
}

export function determineGstFromAmount(amount: number, rate: number, mode: 'exclusive' | 'inclusive'): GstResult {
  return mode === 'exclusive'
    ? calculateFromExclusive(amount, rate)
    : calculateFromInclusive(amount, rate);
}
