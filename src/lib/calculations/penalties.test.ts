import { describe, expect, it } from 'vitest';
import { estimateFailureToLodgePenalty, describePenaltyCap } from './penalties';
import type { PenaltySchedule } from '@/types/ato';

// Sample penalty schedule for testing
const testSchedule: PenaltySchedule['failureToLodge'] = {
  unitValue: 364,
  maxUnits: 5,
  frequencyDays: 28,
  description: 'Test penalty schedule',
};

describe('estimateFailureToLodgePenalty', () => {
  it('returns zero penalty for zero days late', () => {
    const result = estimateFailureToLodgePenalty(0, testSchedule);

    expect(result).toEqual({
      daysLate: 0,
      penaltyUnits: 0,
      amount: 0,
      periodsLate: 0,
    });
  });

  it('returns zero penalty for negative days late', () => {
    const result = estimateFailureToLodgePenalty(-5, testSchedule);

    expect(result).toEqual({
      daysLate: 0,
      penaltyUnits: 0,
      amount: 0,
      periodsLate: 0,
    });
  });

  it('calculates penalty for exactly one period (28 days)', () => {
    const result = estimateFailureToLodgePenalty(28, testSchedule);

    expect(result).toEqual({
      daysLate: 28,
      penaltyUnits: 1,
      amount: 364,
      periodsLate: 1,
    });
  });

  it('calculates penalty for less than one period (1 day)', () => {
    const result = estimateFailureToLodgePenalty(1, testSchedule);

    expect(result).toEqual({
      daysLate: 1,
      penaltyUnits: 1,
      amount: 364,
      periodsLate: 1,
    });
  });

  it('calculates penalty for multiple periods (56 days)', () => {
    const result = estimateFailureToLodgePenalty(56, testSchedule);

    expect(result).toEqual({
      daysLate: 56,
      penaltyUnits: 2,
      amount: 728,
      periodsLate: 2,
    });
  });

  it('caps penalty at maximum units (140 days)', () => {
    const result = estimateFailureToLodgePenalty(140, testSchedule);

    expect(result).toEqual({
      daysLate: 140,
      penaltyUnits: 5,
      amount: 1820,
      periodsLate: 5,
    });
  });

  it('caps penalty at maximum units (200 days)', () => {
    const result = estimateFailureToLodgePenalty(200, testSchedule);

    expect(result).toEqual({
      daysLate: 200,
      penaltyUnits: 5,
      amount: 1820,
      periodsLate: 8, // 200 / 28 = 7.14, ceil to 8, but capped at 5 units
    });
  });

  it('handles fractional days by flooring', () => {
    const result = estimateFailureToLodgePenalty(28.9, testSchedule);

    expect(result).toEqual({
      daysLate: 28,
      penaltyUnits: 1,
      amount: 364,
      periodsLate: 1,
    });
  });

  it('handles large day values (1000 days)', () => {
    const result = estimateFailureToLodgePenalty(1000, testSchedule);

    expect(result).toEqual({
      daysLate: 1000,
      penaltyUnits: 5,
      amount: 1820,
      periodsLate: 36, // ceil(1000/28) = 36, but capped at 5 units
    });
  });
});

describe('describePenaltyCap', () => {
  it('describes penalty cap correctly', () => {
    const description = describePenaltyCap(testSchedule);

    expect(description).toBe('Capped at 5 penalty units ($1,820.00) for small entities.');
  });

  it('handles different penalty schedules', () => {
    const customSchedule: PenaltySchedule['failureToLodge'] = {
      unitValue: 500,
      maxUnits: 3,
      frequencyDays: 30,
      description: 'Custom penalty schedule',
    };
    const description = describePenaltyCap(customSchedule);

    expect(description).toBe('Capped at 3 penalty units ($1,500.00) for small entities.');
  });
});
