import { useMemo } from 'react';
import type { LodgementRecord } from '@/types/lodgement';
import type { PenaltySchedule } from '@/types/ato';
import {
  assessInvestigationRisk,
  type RiskAssessment,
} from '@/lib/calculations/atoInvestigationRisk';

/**
 * Shared selector for the investigation-risk assessment. Centralizes the
 * recompute policy: one memoized pass over [records, penalties], returning
 * null when there are no records. Both OverviewDashboard and LodgementHistory
 * consume this so the 10-detector pass runs once per data change, not twice
 * with divergent memo deps.
 */
export function useInvestigationRisk(
  records: LodgementRecord[],
  penalties?: PenaltySchedule,
): RiskAssessment | null {
  return useMemo(() => {
    if (records.length === 0) return null;
    return assessInvestigationRisk(records, penalties);
  }, [records, penalties]);
}
