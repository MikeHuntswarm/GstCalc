import { describe, it, expect } from 'vitest';
import { toCsv } from './lodgementExport';
import type { LodgementRecord } from '../types/lodgement';

function record(overrides: Partial<LodgementRecord> = {}): LodgementRecord {
  return {
    id: 'lodg_1_abc',
    type: 'gst-bas',
    year: 2024,
    quarter: 'Q1',
    status: 'lodged',
    dueDate: '2024-10-28T00:00:00.000Z',
    lodgementDate: '2024-10-25T00:00:00.000Z',
    amount: 1000,
    isLate: false,
    daysLate: 0,
    hasPenalty: false,
    penaltyAmount: 0,
    notes: '',
    source: 'manual',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('toCsv', () => {
  it('emits a header row', () => {
    const csv = toCsv([]);
    expect(csv.split('\n')[0]).toBe(
      'ID,Type,Year,Quarter,Status,Due Date,Lodgement Date,Amount,Late,Days Late,Has Penalty,Penalty Amount,Notes,Source',
    );
  });

  it('emits one row per record with formatted fields', () => {
    const csv = toCsv([record()]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('lodg_1_abc');
    expect(lines[1]).toContain('gst-bas');
    expect(lines[1]).toContain('1000.00');
  });

  it('escapes notes containing commas and quotes', () => {
    const csv = toCsv([record({ notes: 'Debt, "large" amount' })]);
    const row = csv.split('\n')[1];
    expect(row).toContain('"Debt, ""large"" amount"');
  });

  it('handles negative amounts (refunds)', () => {
    const csv = toCsv([record({ amount: -235 })]);
    expect(csv.split('\n')[1]).toContain('-235.00');
  });
});
