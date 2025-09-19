import { describe, expect, it } from 'vitest';
import { calculateFromExclusive, calculateFromInclusive, determineGstFromAmount } from './gst';

describe('GST calculations', () => {
  it('rounds positive exclusive amounts to two decimals', () => {
    const result = calculateFromExclusive(123.456, 0.1);

    expect(result).toEqual({
      exclusive: 123.46,
      gst: 12.35,
      inclusive: 135.81
    });
  });

  it('handles negative exclusive amounts using half away from zero rounding', () => {
    const result = calculateFromExclusive(-12.345, 0.1);

    expect(result).toEqual({
      exclusive: -12.35,
      gst: -1.23,
      inclusive: -13.58
    });
  });

  it('handles negative inclusive amounts without losing cents due to floating point drift', () => {
    const result = calculateFromInclusive(-121.005, 0.1);

    expect(result).toEqual({
      exclusive: -110,
      gst: -11.01,
      inclusive: -121.01
    });
  });

  it('determines the correct calculation based on mode', () => {
    const exclusive = determineGstFromAmount(50, 0.1, 'exclusive');
    const inclusive = determineGstFromAmount(55, 0.1, 'inclusive');

    expect(exclusive).toEqual(calculateFromExclusive(50, 0.1));
    expect(inclusive).toEqual(calculateFromInclusive(55, 0.1));
  });
});
