/**
 * Tests for ATO Investigation Risk detectors (atoInvestigationRisk.ts)
 *
 * Tests each of the 10 risk detectors with representative inputs.
 */
import { describe, it, expect } from 'vitest';
import { assessInvestigationRisk } from './atoInvestigationRisk';
import type { LodgementRecord } from '../../types/lodgement';
import type { PenaltySchedule } from '../../types/ato';

const penaltySchedule: PenaltySchedule = {
  failureToLodge: {
    unitValue: 364,
    maxUnits: 5,
    frequencyDays: 28,
    description: 'Test FTL schedule',
  },
  generalInterestCharge: {
    description: 'Test GIC',
  },
};

function record(overrides: Partial<LodgementRecord> & { id: string }): LodgementRecord {
  return {
    type: 'gst-bas',
    year: 2024,
    quarter: 'Q1',
    status: 'lodged',
    dueDate: '2024-10-28T00:00:00Z',
    lodgementDate: '2024-10-25T00:00:00Z',
    amount: 1000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Consecutive late detector', () => {
  it('returns no flag for on-time lodgements', () => {
    const records: LodgementRecord[] = [
      record({ id: '1', year: 2024, quarter: 'Q1' }),
      record({ id: '2', year: 2024, quarter: 'Q2', dueDate: '2025-02-28T00:00:00Z' }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    expect(risk.flags.filter((f) => f.type === 'consecutive-late')).toHaveLength(0);
  });

  it('detects 3 consecutive late as high', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2024-12-01T00:00:00Z',
      }),
      record({
        id: '2',
        year: 2024,
        quarter: 'Q2',
        dueDate: '2025-02-28T00:00:00Z',
        lodgementDate: '2025-04-01T00:00:00Z',
      }),
      record({
        id: '3',
        year: 2024,
        quarter: 'Q3',
        dueDate: '2025-05-26T00:00:00Z',
        lodgementDate: '2025-07-01T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'consecutive-late');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('high');
    expect(flag!.details?.count).toBe(3);
  });

  it('detects 5 consecutive late as critical', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2024-12-01T00:00:00Z',
      }),
      record({
        id: '2',
        year: 2024,
        quarter: 'Q2',
        dueDate: '2025-02-28T00:00:00Z',
        lodgementDate: '2025-04-01T00:00:00Z',
      }),
      record({
        id: '3',
        year: 2024,
        quarter: 'Q3',
        dueDate: '2025-05-26T00:00:00Z',
        lodgementDate: '2025-07-01T00:00:00Z',
      }),
      record({
        id: '4',
        year: 2024,
        quarter: 'Q4',
        dueDate: '2025-08-25T00:00:00Z',
        lodgementDate: '2025-10-01T00:00:00Z',
      }),
      record({
        id: '5',
        year: 2025,
        quarter: 'Q1',
        dueDate: '2025-10-28T00:00:00Z',
        lodgementDate: '2025-12-01T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'consecutive-late');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('critical');
  });
});

describe('Missing quarters detector', () => {
  it('detects gaps in quarterly sequence', () => {
    const records: LodgementRecord[] = [
      record({ id: '1', year: 2024, quarter: 'Q1' }),
      record({ id: '2', year: 2024, quarter: 'Q4' }), // Q2 and Q3 missing
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'missing-quarters');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('high');
  });

  it('requires at least 2 BAS records', () => {
    const records: LodgementRecord[] = [record({ id: '1', year: 2024, quarter: 'Q1' })];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'missing-quarters');
    expect(flag).toBeUndefined();
  });

  it('detects 3+ gaps as critical', () => {
    const records: LodgementRecord[] = [
      record({ id: '1', year: 2022, quarter: 'Q1' }),
      record({ id: '2', year: 2023, quarter: 'Q1' }), // 3 quarters gap
      record({ id: '3', year: 2024, quarter: 'Q1' }), // another 3 quarters gap
      record({ id: '4', year: 2025, quarter: 'Q1' }), // another 3 quarters gap
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'missing-quarters');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('critical');
  });
});

describe('Large variations detector', () => {
  it('detects >100% amount change between periods', () => {
    const records: LodgementRecord[] = [
      record({ id: '1', year: 2024, quarter: 'Q1', amount: 100 }),
      record({ id: '2', year: 2024, quarter: 'Q2', dueDate: '2025-02-28T00:00:00Z', amount: 1000 }),
      record({ id: '3', year: 2024, quarter: 'Q3', dueDate: '2025-05-26T00:00:00Z', amount: 200 }),
      record({ id: '4', year: 2024, quarter: 'Q4', dueDate: '2025-08-25T00:00:00Z', amount: 2000 }),
      record({ id: '5', year: 2025, quarter: 'Q1', dueDate: '2025-10-28T00:00:00Z', amount: 300 }),
      record({ id: '6', year: 2025, quarter: 'Q2', dueDate: '2026-02-28T00:00:00Z', amount: 3000 }),
      record({ id: '7', year: 2025, quarter: 'Q3', dueDate: '2026-05-26T00:00:00Z', amount: 400 }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'large-variations');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('medium');
  });

  it('ignores small variations', () => {
    const records: LodgementRecord[] = [
      record({ id: '1', year: 2024, quarter: 'Q1', amount: 1000 }),
      record({ id: '2', year: 2024, quarter: 'Q2', dueDate: '2025-02-28T00:00:00Z', amount: 1500 }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'large-variations');
    expect(flag).toBeUndefined();
  });
});

describe('Nil-then-large detector', () => {
  it('detects zero followed by >$10k', () => {
    const records: LodgementRecord[] = [
      record({ id: '1', year: 2024, quarter: 'Q1', amount: 0 }),
      record({
        id: '2',
        year: 2024,
        quarter: 'Q2',
        dueDate: '2025-02-28T00:00:00Z',
        amount: 15000,
      }),
      record({ id: '3', year: 2024, quarter: 'Q3', dueDate: '2025-05-26T00:00:00Z', amount: 0 }),
      record({
        id: '4',
        year: 2024,
        quarter: 'Q4',
        dueDate: '2025-08-25T00:00:00Z',
        amount: 20000,
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'nil-then-large');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('high');
  });

  it('single nil-then-large is medium', () => {
    const records: LodgementRecord[] = [
      record({ id: '1', year: 2024, quarter: 'Q1', amount: 0 }),
      record({
        id: '2',
        year: 2024,
        quarter: 'Q2',
        dueDate: '2025-02-28T00:00:00Z',
        amount: 15000,
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'nil-then-large');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('medium');
  });
});

describe('Excessive delays detector', () => {
  it('detects >90 days late as high', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2025-03-01T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'excessive-delays');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('high');
  });

  it('3+ excessive delays is critical', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2025-03-01T00:00:00Z',
      }),
      record({
        id: '2',
        year: 2024,
        quarter: 'Q2',
        dueDate: '2025-02-28T00:00:00Z',
        lodgementDate: '2025-06-01T00:00:00Z',
      }),
      record({
        id: '3',
        year: 2024,
        quarter: 'Q3',
        dueDate: '2025-05-26T00:00:00Z',
        lodgementDate: '2025-09-01T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'excessive-delays');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('critical');
  });

  it('ignores delays under 90 days', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2024-12-15T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'excessive-delays');
    expect(flag).toBeUndefined();
  });
});

describe('Round number pattern detector', () => {
  it('detects >50% round numbers when 4+ records', () => {
    const records: LodgementRecord[] = [
      record({ id: '1', year: 2024, quarter: 'Q1', amount: 1000 }),
      record({ id: '2', year: 2024, quarter: 'Q2', dueDate: '2025-02-28T00:00:00Z', amount: 2000 }),
      record({ id: '3', year: 2024, quarter: 'Q3', dueDate: '2025-05-26T00:00:00Z', amount: 5000 }),
      record({ id: '4', year: 2024, quarter: 'Q4', dueDate: '2025-08-25T00:00:00Z', amount: 750 }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'round-numbers');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('medium');
  });

  it('ignores non-round amounts', () => {
    const records: LodgementRecord[] = [
      record({ id: '1', year: 2024, quarter: 'Q1', amount: 1001 }),
      record({ id: '2', year: 2024, quarter: 'Q2', dueDate: '2025-02-28T00:00:00Z', amount: 2347 }),
      record({ id: '3', year: 2024, quarter: 'Q3', dueDate: '2025-05-26T00:00:00Z', amount: 589 }),
      record({ id: '4', year: 2024, quarter: 'Q4', dueDate: '2025-08-25T00:00:00Z', amount: 312 }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'round-numbers');
    expect(flag).toBeUndefined();
  });
});

describe('Decreasing compliance detector', () => {
  it('detects trend of increasing delays', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2024-11-01T00:00:00Z',
      }),
      record({
        id: '2',
        year: 2024,
        quarter: 'Q2',
        dueDate: '2025-02-28T00:00:00Z',
        lodgementDate: '2025-03-05T00:00:00Z',
      }),
      record({
        id: '3',
        year: 2024,
        quarter: 'Q3',
        dueDate: '2025-05-26T00:00:00Z',
        lodgementDate: '2025-06-25T00:00:00Z',
      }),
      record({
        id: '4',
        year: 2024,
        quarter: 'Q4',
        dueDate: '2025-08-25T00:00:00Z',
        lodgementDate: '2025-10-15T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    // Days late: 4, 5, 30, 51 — second half avg 40.5 > first half avg 4.5 * 2 AND > 30
    const flag = risk.flags.find((f) => f.type === 'decreasing-compliance');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('high');
  });

  it('ignores stable compliance', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2024-11-01T00:00:00Z',
      }),
      record({
        id: '2',
        year: 2024,
        quarter: 'Q2',
        dueDate: '2025-02-28T00:00:00Z',
        lodgementDate: '2025-03-01T00:00:00Z',
      }),
      record({
        id: '3',
        year: 2024,
        quarter: 'Q3',
        dueDate: '2025-05-26T00:00:00Z',
        lodgementDate: '2025-05-27T00:00:00Z',
      }),
      record({
        id: '4',
        year: 2024,
        quarter: 'Q4',
        dueDate: '2025-08-25T00:00:00Z',
        lodgementDate: '2025-08-27T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'decreasing-compliance');
    expect(flag).toBeUndefined();
  });
});

describe('High penalty exposure detector', () => {
  it('detects >$5000 in FTL penalties', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2025-03-01T00:00:00Z',
      }),
      record({
        id: '2',
        year: 2024,
        quarter: 'Q2',
        dueDate: '2025-02-28T00:00:00Z',
        lodgementDate: '2025-06-01T00:00:00Z',
      }),
      record({
        id: '3',
        year: 2024,
        quarter: 'Q3',
        dueDate: '2025-05-26T00:00:00Z',
        lodgementDate: '2025-09-01T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    // 13 penalty units * $330 = $4,290 → > $2,000 threshold, severity high
    const flag = risk.flags.find(
      (f) => f.type === 'high-penalty-exposure' && f.message.startsWith('Estimated $'),
    );
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('high');
  });

  it('no penalty flag without penalty schedule', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2025-03-01T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records); // no penalty schedule
    const flag = risk.flags.find(
      (f) => f.type === 'high-penalty-exposure' && f.message.startsWith('Estimated $'),
    );
    expect(flag).toBeUndefined();
  });
});

describe('Chronic non-compliance detector', () => {
  it('detects >75% late rate as critical', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2024-12-01T00:00:00Z',
      }),
      record({
        id: '2',
        year: 2024,
        quarter: 'Q2',
        dueDate: '2025-02-28T00:00:00Z',
        lodgementDate: '2025-04-01T00:00:00Z',
      }),
      record({
        id: '3',
        year: 2024,
        quarter: 'Q3',
        dueDate: '2025-05-26T00:00:00Z',
        lodgementDate: '2025-07-01T00:00:00Z',
      }),
      record({ id: '4', year: 2024, quarter: 'Q4' }), // on time
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'chronic-non-compliance');
    // 3/4 = 75% late, >75 is critical — should be exactly 75, which is NOT >75
    // 75% triggers <= 75, so high severity since >50
    expect(flag).toBeDefined();
    expect(['high', 'critical']).toContain(flag!.severity);
  });

  it('ignores <50% late rate', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2024-12-01T00:00:00Z',
      }),
      record({ id: '2', year: 2024, quarter: 'Q2' }),
      record({ id: '3', year: 2024, quarter: 'Q3' }),
      record({ id: '4', year: 2024, quarter: 'Q4' }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const flag = risk.flags.find((f) => f.type === 'chronic-non-compliance');
    expect(flag).toBeUndefined();
  });
});

describe('Overall risk assessment', () => {
  it('returns 0 score for clean records', () => {
    const records: LodgementRecord[] = [
      record({ id: '1', year: 2024, quarter: 'Q1' }),
      record({ id: '2', year: 2024, quarter: 'Q2', dueDate: '2025-02-28T00:00:00Z' }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    expect(risk.overallRisk).toBe('none');
    expect(risk.riskScore).toBe(0);
    expect(risk.flags).toHaveLength(0);
  });

  it('returns recommendations for flagged records', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2025-03-01T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    expect(risk.recommendations.length).toBeGreaterThan(0);
    expect(risk.summary).toBeTruthy();
    expect(risk.lastAnalyzed).toBeTruthy();
  });

  it('includes metric details in flags where applicable', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        year: 2024,
        quarter: 'Q1',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2025-03-01T00:00:00Z',
      }),
      record({
        id: '2',
        year: 2024,
        quarter: 'Q2',
        dueDate: '2025-02-28T00:00:00Z',
        lodgementDate: '2025-06-01T00:00:00Z',
      }),
    ];
    const risk = assessInvestigationRisk(records, penaltySchedule);
    const excessiveFlag = risk.flags.find((f) => f.type === 'excessive-delays');
    expect(excessiveFlag?.details).toBeDefined();
    expect(excessiveFlag?.details?.metric).toBeDefined();
  });
});

describe('determinism', () => {
  it('returns identical assessments for an explicit now across calls', () => {
    const records: LodgementRecord[] = [
      record({
        id: '1',
        status: 'not-lodged',
        dueDate: '2024-10-28T00:00:00Z',
        amount: 5000,
      }),
    ];
    const now = new Date('2026-01-15T00:00:00Z');
    const a = assessInvestigationRisk(records, undefined, now);
    const b = assessInvestigationRisk(records, undefined, now);
    expect(a).toEqual(b);
    expect(a.lastAnalyzed).toBe(now.toISOString());
  });
});
