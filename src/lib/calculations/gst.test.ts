import { describe, expect, it } from 'vitest';
import { calculateFromExclusive, calculateFromInclusive, determineGstFromAmount } from './gst';

describe('GST calculations', () => {
  it('rounds positive exclusive amounts to two decimals', () => {
    const result = calculateFromExclusive(123.456, 0.1);

    expect(result).toEqual({
      exclusive: 123.46,
      gst: 12.35,
      inclusive: 135.81,
    });
  });

  it('handles negative exclusive amounts using half away from zero rounding', () => {
    const result = calculateFromExclusive(-12.345, 0.1);

    expect(result).toEqual({
      exclusive: -12.35,
      gst: -1.23,
      inclusive: -13.58,
    });
  });

  it('handles negative inclusive amounts without losing cents due to floating point drift', () => {
    const result = calculateFromInclusive(-121.005, 0.1);

    expect(result).toEqual({
      exclusive: -110,
      gst: -11.01,
      inclusive: -121.01,
    });
  });

  it('determines the correct calculation based on mode', () => {
    const exclusive = determineGstFromAmount(50, 0.1, 'exclusive');
    const inclusive = determineGstFromAmount(55, 0.1, 'inclusive');

    expect(exclusive).toEqual(calculateFromExclusive(50, 0.1));
    expect(inclusive).toEqual(calculateFromInclusive(55, 0.1));
  });
});

describe('GST calculation input validation', () => {
  // Tests for calculateFromExclusive
  it('calculateFromExclusive throws error for invalid amount', () => {
    expect(() => calculateFromExclusive(NaN, 0.1)).toThrow('Invalid amount: amount must be a valid number.');
    expect(() => calculateFromExclusive('abc' as unknown as number, 0.1)).toThrow(
      'Invalid amount: amount must be a valid number.',
    );
  });

  it('calculateFromExclusive throws error for invalid rate', () => {
    expect(() => calculateFromExclusive(100, NaN)).toThrow('Invalid rate: rate must be a valid non-negative number.');
    expect(() => calculateFromExclusive(100, -0.1)).toThrow('Invalid rate: rate must be a valid non-negative number.');
    expect(() => calculateFromExclusive(100, 'abc' as unknown as number)).toThrow(
      'Invalid rate: rate must be a valid non-negative number.',
    );
  });

  // Tests for calculateFromInclusive
  it('calculateFromInclusive throws error for invalid amount', () => {
    expect(() => calculateFromInclusive(NaN, 0.1)).toThrow('Invalid amount: amount must be a valid number.');
    expect(() => calculateFromInclusive('abc' as unknown as number, 0.1)).toThrow(
      'Invalid amount: amount must be a valid number.',
    );
  });

  it('calculateFromInclusive throws error for invalid rate', () => {
    expect(() => calculateFromInclusive(100, NaN)).toThrow('Invalid rate: rate must be a valid non-negative number.');
    expect(() => calculateFromInclusive(100, -0.1)).toThrow('Invalid rate: rate must be a valid non-negative number.');
    expect(() => calculateFromInclusive(100, 'abc' as unknown as number)).toThrow(
      'Invalid rate: rate must be a valid non-negative number.',
    );
  });

  // Tests for determineGstFromAmount
  it('determineGstFromAmount throws error for invalid amount', () => {
    expect(() => determineGstFromAmount(NaN, 0.1, 'exclusive')).toThrow('Invalid amount: amount must be a valid number.');
    expect(() => determineGstFromAmount('abc' as unknown as number, 0.1, 'inclusive')).toThrow(
      'Invalid amount: amount must be a valid number.',
    );
  });

  it('determineGstFromAmount throws error for invalid rate', () => {
    expect(() => determineGstFromAmount(100, NaN, 'exclusive')).toThrow('Invalid rate: rate must be a valid non-negative number.');
    expect(() => determineGstFromAmount(100, -0.1, 'inclusive')).toThrow('Invalid rate: rate must be a valid non-negative number.');
    expect(() => determineGstFromAmount(100, 'abc' as unknown as number, 'exclusive')).toThrow(
      'Invalid rate: rate must be a valid non-negative number.',
    );
  });

  it('determineGstFromAmount throws error for invalid mode', () => {
    expect(() => determineGstFromAmount(100, 0.1, 'invalid' as unknown as 'exclusive')).toThrow(
      'Invalid mode: mode must be either "exclusive" or "inclusive".',
    );
    expect(() => determineGstFromAmount(100, 0.1, null as unknown as 'exclusive')).toThrow(
      'Invalid mode: mode must be either "exclusive" or "inclusive".',
    );
  });
});
