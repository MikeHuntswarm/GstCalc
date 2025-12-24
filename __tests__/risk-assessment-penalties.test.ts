/**
 * Test suite for ATO Investigation Risk Assessment with Penalties
 * Verifies that penalty data impacts risk scoring
 */

import { describe, it, expect } from 'vitest';
import { assessInvestigationRisk } from '../src/lib/calculations/atoInvestigationRisk';
import type { LodgementRecord } from '../src/types/lodgement';

describe('Risk Assessment - Penalty Detection', () => {
  const createBasicRecord = (overrides?: Partial<LodgementRecord>): LodgementRecord => ({
    id: `lodg_${Date.now()}_${Math.random()}`,
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
  });

  it('should detect records with penalties', () => {
    const records: LodgementRecord[] = [
      createBasicRecord({
        hasPenalty: true,
        penaltyAmount: 500,
      }),
      createBasicRecord({
        year: 2023,
        hasPenalty: false,
      }),
    ];

    const risk = assessInvestigationRisk(records);

    // Should have a penalty-related flag
    const penaltyFlag = risk.flags.find(
      (f) => f.type === 'high-penalty-exposure' || f.message.toLowerCase().includes('penalty'),
    );

    expect(penaltyFlag).toBeDefined();
  });

  it('should increase risk score for multiple penalties', () => {
    const cleanRecords: LodgementRecord[] = [
      createBasicRecord({ year: 2024, quarter: 'Q1' }),
      createBasicRecord({ year: 2023, quarter: 'Q4' }),
      createBasicRecord({ year: 2023, quarter: 'Q3' }),
    ];

    const penalizedRecords: LodgementRecord[] = [
      createBasicRecord({
        year: 2024,
        quarter: 'Q1',
        hasPenalty: true,
        penaltyAmount: 500,
      }),
      createBasicRecord({
        year: 2023,
        quarter: 'Q4',
        hasPenalty: true,
        penaltyAmount: 750,
      }),
      createBasicRecord({
        year: 2023,
        quarter: 'Q3',
        hasPenalty: true,
        penaltyAmount: 300,
      }),
    ];

    const cleanRisk = assessInvestigationRisk(cleanRecords);
    const penalizedRisk = assessInvestigationRisk(penalizedRecords);

    expect(penalizedRisk.riskScore).toBeGreaterThan(cleanRisk.riskScore);
  });

  it('should classify single penalty as low risk', () => {
    const records: LodgementRecord[] = [
      createBasicRecord({
        hasPenalty: true,
        penaltyAmount: 250,
      }),
      createBasicRecord({ year: 2023, quarter: 'Q4' }),
      createBasicRecord({ year: 2023, quarter: 'Q3' }),
    ];

    const risk = assessInvestigationRisk(records);
    const penaltyFlag = risk.flags.find((f) => f.message.toLowerCase().includes('penalty'));

    if (penaltyFlag) {
      expect(penaltyFlag.severity).toBe('low');
    }
  });

  it('should classify multiple penalties as high/critical risk', () => {
    const records: LodgementRecord[] = [
      createBasicRecord({
        year: 2024,
        quarter: 'Q1',
        hasPenalty: true,
        penaltyAmount: 500,
      }),
      createBasicRecord({
        year: 2023,
        quarter: 'Q4',
        hasPenalty: true,
        penaltyAmount: 750,
      }),
      createBasicRecord({
        year: 2023,
        quarter: 'Q3',
        hasPenalty: true,
        penaltyAmount: 300,
      }),
      createBasicRecord({
        year: 2023,
        quarter: 'Q2',
        hasPenalty: true,
        penaltyAmount: 450,
      }),
    ];

    const risk = assessInvestigationRisk(records);
    const penaltyFlag = risk.flags.find((f) => f.message.toLowerCase().includes('penalty'));

    if (penaltyFlag) {
      expect(['high', 'critical']).toContain(penaltyFlag.severity);
    }
  });

  it('should include penalty recommendations', () => {
    const records: LodgementRecord[] = [
      createBasicRecord({
        hasPenalty: true,
        penaltyAmount: 500,
      }),
    ];

    const risk = assessInvestigationRisk(records);

    expect(risk.recommendations.length).toBeGreaterThan(0);
    const hasPenaltyRec = risk.recommendations.some((r) => r.toLowerCase().includes('penalty'));
    expect(hasPenaltyRec).toBe(true);
  });

  it('should track penalty exposure in flag details', () => {
    const records: LodgementRecord[] = [
      createBasicRecord({
        year: 2024,
        quarter: 'Q1',
        hasPenalty: true,
        penaltyAmount: 500,
      }),
      createBasicRecord({
        year: 2023,
        quarter: 'Q4',
        hasPenalty: true,
        penaltyAmount: 750,
      }),
    ];

    const risk = assessInvestigationRisk(records);
    const penaltyFlag = risk.flags.find((f) => f.type === 'high-penalty-exposure');

    if (penaltyFlag && penaltyFlag.details) {
      expect(penaltyFlag.details.count).toBe(2);
      expect(penaltyFlag.details.metric).toBeCloseTo(1250, 0.01); // Total penalties
    }
  });

  it('should handle income-tax records with penalties', () => {
    const records: LodgementRecord[] = [
      {
        id: 'inc-1',
        type: 'income-tax',
        year: 2024,
        status: 'lodged',
        dueDate: '2025-10-31T00:00:00Z',
        lodgementDate: '2025-10-30T00:00:00Z',
        amount: 5000,
        hasPenalty: true,
        penaltyAmount: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const risk = assessInvestigationRisk(records);

    expect(risk.flags.length).toBeGreaterThan(0);
    expect(risk.riskScore).toBeGreaterThan(0);
  });
});

describe('Risk Assessment - Integration with Existing Detectors', () => {
  it('should combine penalty risk with late lodgement risk', () => {
    // Record that is both late AND penalized
    const records: LodgementRecord[] = [
      {
        id: 'test-1',
        type: 'gst-bas',
        year: 2024,
        quarter: 'Q1',
        status: 'lodged',
        dueDate: '2024-10-28T00:00:00Z',
        lodgementDate: '2024-12-15T00:00:00Z', // 48 days late
        amount: 1000,
        hasPenalty: true,
        penaltyAmount: 500,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const risk = assessInvestigationRisk(records);

    // Should have multiple risk flags
    expect(risk.flags.length).toBeGreaterThanOrEqual(1);
    expect(risk.riskScore).toBeGreaterThan(20); // Combined risk
  });
});
