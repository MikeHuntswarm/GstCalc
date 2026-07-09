/**
 * Tests for LodgementHistory Zustand store
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useLodgementHistoryStore } from '../src/store/lodgementHistory';
import type { LodgementRecord } from '../src/types/lodgement';

function record(
  overrides: Partial<Omit<LodgementRecord, 'id' | 'createdAt' | 'updatedAt'>> = {},
): Omit<LodgementRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const base: Omit<LodgementRecord, 'id' | 'createdAt' | 'updatedAt'> = {
    type: 'gst-bas',
    year: 2024,
    quarter: 'Q1',
    status: 'lodged',
    dueDate: '2024-10-28T00:00:00Z',
    lodgementDate: '2024-10-25T00:00:00Z',
    amount: 1000,
  };
  // If type is not gst-bas, remove quarter
  if (overrides.type && overrides.type !== 'gst-bas') {
    delete base.quarter;
  }
  return { ...base, ...overrides };
}

describe('LodgementHistoryStore', () => {
  beforeEach(() => {
    useLodgementHistoryStore.setState({ records: [] });
  });

  describe('addLodgement', () => {
    it('adds a record with auto-generated id and timestamps', () => {
      const store = useLodgementHistoryStore.getState();
      const result = store.addLodgement(record());

      expect(result.id).toMatch(/^lodg_\d+_\w+$/);
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBeTruthy();
      expect(useLodgementHistoryStore.getState().records).toHaveLength(1);
    });

    it('automatically calculates late days', () => {
      const store = useLodgementHistoryStore.getState();
      const result = store.addLodgement(
        record({
          dueDate: '2024-10-01T00:00:00Z',
          lodgementDate: '2024-10-15T00:00:00Z',
        }),
      );

      expect(result.isLate).toBe(true);
      expect(result.daysLate).toBe(14);
    });

    it('does not flag on-time lodgements as late', () => {
      const store = useLodgementHistoryStore.getState();
      const result = store.addLodgement(
        record({
          dueDate: '2024-10-15T00:00:00Z',
          lodgementDate: '2024-10-01T00:00:00Z',
        }),
      );

      expect(result.isLate).toBeUndefined();
      expect(result.daysLate).toBeUndefined();
    });

    it('prevents duplicate BAS period entries', () => {
      const store = useLodgementHistoryStore.getState();
      store.addLodgement(record({ year: 2024, quarter: 'Q1' }));

      expect(() => {
        store.addLodgement(record({ year: 2024, quarter: 'Q1' }));
      }).toThrow(/already exists/);
    });

    it('validates records through Zod schema', () => {
      const store = useLodgementHistoryStore.getState();
      // Passing an invalid type should be caught
      expect(() => {
        store.addLodgement(record({ type: 'invalid-type' as unknown as LodgementRecord['type'] }));
      }).toThrow();
    });
  });

  describe('updateLodgement', () => {
    it('updates existing record fields', () => {
      const store = useLodgementHistoryStore.getState();
      const created = store.addLodgement(record());

      store.updateLodgement(created.id, { amount: 2500, notes: 'Updated' });
      const updated = store.getLodgementById(created.id);

      expect(updated?.amount).toBe(2500);
      expect(updated?.notes).toBe('Updated');
    });

    it('recalculates late days on date changes', () => {
      const store = useLodgementHistoryStore.getState();
      const created = store.addLodgement(record());

      store.updateLodgement(created.id, {
        dueDate: '2024-10-01T00:00:00Z',
        lodgementDate: '2024-10-20T00:00:00Z',
      });

      const updated = store.getLodgementById(created.id);
      expect(updated?.isLate).toBe(true);
      expect(updated?.daysLate).toBe(19);
    });

    it('throws for non-existent id', () => {
      const store = useLodgementHistoryStore.getState();
      expect(() => store.updateLodgement('nonexistent', { amount: 100 })).toThrow(/not found/);
    });
  });

  describe('removeLodgement', () => {
    it('removes a record by id', () => {
      const store = useLodgementHistoryStore.getState();
      const created = store.addLodgement(record());
      expect(useLodgementHistoryStore.getState().records).toHaveLength(1);

      store.removeLodgement(created.id);
      expect(useLodgementHistoryStore.getState().records).toHaveLength(0);
    });

    it('no-ops for non-existent id', () => {
      const store = useLodgementHistoryStore.getState();
      store.addLodgement(record());
      store.removeLodgement('nonexistent');
      expect(useLodgementHistoryStore.getState().records).toHaveLength(1);
    });
  });

  describe('query methods', () => {
    beforeEach(() => {
      const store = useLodgementHistoryStore.getState();
      store.addLodgement(record({ year: 2024, quarter: 'Q1', amount: 1000, type: 'gst-bas' }));
      store.addLodgement(
        record({
          year: 2024,
          quarter: 'Q2',
          amount: 2000,
          type: 'gst-bas',
          status: 'not-lodged',
          lodgementDate: undefined,
        }),
      );
      store.addLodgement(
        record({ year: 2023, quarter: undefined, amount: 500, type: 'income-tax' }),
      );
    });

    it('getLodgementById returns correct record', () => {
      const store = useLodgementHistoryStore.getState();
      const allRecords = store.records;
      const found = store.getLodgementById(allRecords[0].id);
      expect(found).toBeDefined();
      expect(found!.year).toBe(2024);
    });

    it('getLodgementsByYear filters correctly', () => {
      const store = useLodgementHistoryStore.getState();
      expect(store.getLodgementsByYear(2024)).toHaveLength(2);
      expect(store.getLodgementsByYear(2023)).toHaveLength(1);
    });

    it('getLodgementsByType filters correctly', () => {
      const store = useLodgementHistoryStore.getState();
      expect(store.getLodgementsByType('gst-bas')).toHaveLength(2);
      expect(store.getLodgementsByType('income-tax')).toHaveLength(1);
    });

    it('getLodgementsByStatus filters correctly', () => {
      const store = useLodgementHistoryStore.getState();
      expect(store.getLodgementsByStatus('lodged')).toHaveLength(2);
      expect(store.getLodgementsByStatus('not-lodged')).toHaveLength(1);
    });

    it('getFilteredLodgements handles multi-filter', () => {
      const store = useLodgementHistoryStore.getState();
      const result = store.getFilteredLodgements({ type: 'gst-bas', year: 2024 });
      expect(result).toHaveLength(2);
    });
  });

  describe('summary', () => {
    it('computes correct aggregate statistics', () => {
      const store = useLodgementHistoryStore.getState();
      store.addLodgement(record({ year: 2024, quarter: 'Q1', amount: 1000 }));
      store.addLodgement(
        record({
          year: 2024,
          quarter: 'Q2',
          amount: 2000,
          status: 'not-lodged',
          lodgementDate: undefined,
        }),
      );
      store.addLodgement(
        record({
          year: 2024,
          quarter: 'Q3',
          amount: 500,
          dueDate: '2025-05-01T00:00:00Z',
          lodgementDate: '2025-06-01T00:00:00Z',
          hasPenalty: true,
          penaltyAmount: 330,
        }),
      );

      const summary = store.getSummary();
      expect(summary.totalRecords).toBe(3);
      expect(summary.lodgedCount).toBe(2);
      expect(summary.notLodgedCount).toBe(1);
      expect(summary.totalAmount).toBe(3500);
      expect(summary.totalOutstandingAmount).toBe(2000);
      expect(summary.lateCount).toBe(1);
      expect(summary.penaltyCount).toBe(1);
      expect(summary.totalPenalties).toBe(330);
    });

    it('returns empty stats for no records', () => {
      const store = useLodgementHistoryStore.getState();
      const summary = store.getSummary();
      expect(summary.totalRecords).toBe(0);
      expect(summary.totalAmount).toBe(0);
    });
  });

  describe('markAsLodged / markAsNotLodged', () => {
    it('marks record as lodged with a date', () => {
      const store = useLodgementHistoryStore.getState();
      const created = store.addLodgement(
        record({ status: 'not-lodged', lodgementDate: undefined }),
      );

      store.markAsLodged(created.id, '2024-11-01T00:00:00Z');
      const updated = store.getLodgementById(created.id);
      expect(updated?.status).toBe('lodged');
      expect(updated?.lodgementDate).toBe('2024-11-01T00:00:00Z');
    });

    it('marks record as not-lodged clearing the date', () => {
      const store = useLodgementHistoryStore.getState();
      const created = store.addLodgement(record());

      store.markAsNotLodged(created.id);
      const updated = store.getLodgementById(created.id);
      expect(updated?.status).toBe('not-lodged');
      expect(updated?.lodgementDate).toBeUndefined();
    });
  });

  describe('bulk operations', () => {
    it('importRecords replaces all records', () => {
      const store = useLodgementHistoryStore.getState();
      store.addLodgement(record());

      const imported: LodgementRecord[] = [
        {
          ...record(),
          id: 'lodg_1_abc',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        } as LodgementRecord,
        {
          ...record({ year: 2023 }),
          id: 'lodg_2_def',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        } as LodgementRecord,
      ];

      store.importRecords(imported);
      expect(useLodgementHistoryStore.getState().records).toHaveLength(2);
    });

    it('clearAllRecords removes everything', () => {
      const store = useLodgementHistoryStore.getState();
      store.addLodgement(record());
      store.addLodgement(record({ quarter: 'Q2' }));

      store.clearAllRecords();
      expect(useLodgementHistoryStore.getState().records).toHaveLength(0);
    });
  });
});
