import type { PenaltySchedule } from '@/types/ato';

export interface FailureToLodgeEstimate {
  daysLate: number;
  penaltyUnits: number;
  amount: number;
  periodsLate: number;
}

export function estimateFailureToLodgePenalty(
  daysLate: number,
  schedule: PenaltySchedule['failureToLodge']
): FailureToLodgeEstimate {
  const safeDaysLate = Math.max(0, Math.floor(daysLate));
  const periods = Math.min(
    Math.ceil(safeDaysLate / schedule.frequencyDays) || (safeDaysLate > 0 ? 1 : 0),
    schedule.maxUnits
  );
  const penaltyUnits = periods;
  const amount = penaltyUnits * schedule.unitValue;

  return {
    daysLate: safeDaysLate,
    penaltyUnits,
    amount,
    periodsLate: periods
  };
}

export function describePenaltyCap(schedule: PenaltySchedule['failureToLodge']) {
  return `Capped at ${schedule.maxUnits} penalty units (${(schedule.maxUnits * schedule.unitValue).toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD'
  })}) for small entities.`;
}
