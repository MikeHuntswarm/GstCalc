import { describe, it, expect } from 'vitest';
import { toIsoDate, importRecords } from './lodgementImport';
import type { LodgementRecord } from '../types/lodgement';

function base(overrides: Partial<Omit<LodgementRecord, 'id' | 'createdAt' | 'updatedAt'>> = {}) {
  return {
    type: 'gst-bas' as const,
    year: 2024,
    quarter: 'Q1' as const,
    status: 'lodged' as const,
    dueDate: '2024-10-28',
    lodgementDate: '2024-10-25',
    amount: 1000,
    notes: '',
    ...overrides,
  };
}

describe('toIsoDate', () => {
  it('converts a YYYY-MM-DD string to a full ISO timestamp (UTC, timezone-safe)', () => {
    expect(toIsoDate('2024-10-28')).toBe('2024-10-28T00:00:00.000Z');
  });
});

describe('importRecords', () => {
  it('counts successes', () => {
    const addFn = () => ({ id: 'x' }) as LodgementRecord;
    const result = importRecords([base(), base({ year: 2023 })], addFn);
    expect(result).toEqual({ success: 2, skipped: 0, errors: 0 });
  });

  it('counts duplicates as skipped', () => {
    const addFn = () => {
      throw new Error('A gst-bas lodgement for 2024 Q1 already exists');
    };
    const result = importRecords([base()], addFn);
    expect(result).toEqual({ success: 0, skipped: 1, errors: 0 });
  });

  it('counts other errors separately', () => {
    const addFn = () => {
      throw new Error('Validation failed');
    };
    const result = importRecords([base()], addFn);
    expect(result).toEqual({ success: 0, skipped: 0, errors: 1 });
  });

  it('converts dates to ISO before adding', () => {
    const added: Array<Record<string, unknown>> = [];
    const addFn = (r: Omit<LodgementRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      added.push(r);
      return { id: 'x' } as LodgementRecord;
    };
    importRecords([base()], addFn);
    expect(added[0].dueDate).toBe('2024-10-28T00:00:00.000Z');
    expect(added[0].lodgementDate).toBe('2024-10-25T00:00:00.000Z');
    expect(added[0].source).toBe('manual');
  });
});
