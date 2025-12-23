import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LodgementRecord, LodgementSummary, LodgementFilters } from '@/types/lodgement';
import { LodgementRecordSchema } from '@/types/lodgement.schema';
import { STORAGE_KEYS } from '@/lib/constants';

interface LodgementHistoryState {
  records: LodgementRecord[];

  // CRUD operations
  addLodgement: (
    record: Omit<LodgementRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ) => LodgementRecord;
  updateLodgement: (id: string, updates: Partial<Omit<LodgementRecord, 'id'>>) => void;
  removeLodgement: (id: string) => void;

  // Status management
  markAsLodged: (id: string, lodgementDate: string) => void;
  markAsNotLodged: (id: string) => void;

  // Conversion utility
  convertFromMissed: (missedPeriod: {
    type: 'gst-bas' | 'company-tax';
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | '';
    year: string;
    amount: string;
    dueDate: string;
    notes: string;
  }) => LodgementRecord;

  // Querying
  getLodgementById: (id: string) => LodgementRecord | undefined;
  getLodgementsByYear: (year: number) => LodgementRecord[];
  getLodgementsByType: (type: 'gst-bas' | 'company-tax') => LodgementRecord[];
  getLodgementsByStatus: (status: 'lodged' | 'not-lodged') => LodgementRecord[];
  getFilteredLodgements: (filters: LodgementFilters) => LodgementRecord[];

  // Duplicate prevention
  checkDuplicatePeriod: (
    type: 'gst-bas' | 'company-tax',
    year: number,
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4',
  ) => LodgementRecord | undefined;

  // Statistics
  getSummary: (filters?: LodgementFilters) => LodgementSummary;

  // Bulk operations
  importRecords: (records: LodgementRecord[]) => void;
  clearAllRecords: () => void;
}

const generateId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `lodg_${timestamp}_${random}`;
};

const validateRecord = (record: LodgementRecord): LodgementRecord => {
  const validated = LodgementRecordSchema.parse(record);
  return validated as LodgementRecord;
};

export const useLodgementHistoryStore = create<LodgementHistoryState>()(
  persist(
    (set, get) => ({
      records: [],

      addLodgement: (record) => {
        const now = new Date().toISOString();
        const newRecord: LodgementRecord = {
          ...record,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };

        // Validate before adding
        const validated = validateRecord(newRecord);

        // Check for duplicates
        const duplicate = get().checkDuplicatePeriod(
          validated.type,
          validated.year,
          validated.quarter,
        );
        if (duplicate) {
          throw new Error(
            `A ${validated.type} lodgement for ${validated.year}${validated.quarter ? ` ${validated.quarter}` : ''} already exists`,
          );
        }

        set((state) => ({
          records: [...state.records, validated],
        }));

        return validated;
      },

      updateLodgement: (id, updates) => {
        set((state) => {
          const index = state.records.findIndex((r) => r.id === id);
          if (index === -1) {
            throw new Error(`Lodgement with ID ${id} not found`);
          }

          const updated: LodgementRecord = {
            ...state.records[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          // Validate updated record
          const validated = validateRecord(updated);

          const newRecords = [...state.records];
          newRecords[index] = validated;

          return { records: newRecords };
        });
      },

      removeLodgement: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
      },

      markAsLodged: (id, lodgementDate) => {
        get().updateLodgement(id, {
          status: 'lodged',
          lodgementDate,
        });
      },

      markAsNotLodged: (id) => {
        get().updateLodgement(id, {
          status: 'not-lodged',
          lodgementDate: undefined,
        });
      },

      convertFromMissed: (missedPeriod) => {
        const year = parseInt(missedPeriod.year, 10);
        const amount = parseFloat(missedPeriod.amount) || 0;

        if (isNaN(year)) {
          throw new Error('Invalid year');
        }

        const record: Omit<LodgementRecord, 'id' | 'createdAt' | 'updatedAt'> = {
          type: missedPeriod.type,
          year,
          quarter:
            missedPeriod.type === 'gst-bas' && missedPeriod.quarter
              ? (missedPeriod.quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4')
              : undefined,
          status: 'not-lodged',
          dueDate: missedPeriod.dueDate || new Date().toISOString(),
          amount,
          notes: missedPeriod.notes || '',
          source: 'converted-from-missed',
        };

        return get().addLodgement(record);
      },

      getLodgementById: (id) => {
        return get().records.find((r) => r.id === id);
      },

      getLodgementsByYear: (year) => {
        return get().records.filter((r) => r.year === year);
      },

      getLodgementsByType: (type) => {
        return get().records.filter((r) => r.type === type);
      },

      getLodgementsByStatus: (status) => {
        return get().records.filter((r) => r.status === status);
      },

      getFilteredLodgements: (filters) => {
        let filtered = get().records;

        if (filters.type) {
          filtered = filtered.filter((r) => r.type === filters.type);
        }

        if (filters.year !== undefined) {
          filtered = filtered.filter((r) => r.year === filters.year);
        }

        if (filters.status) {
          filtered = filtered.filter((r) => r.status === filters.status);
        }

        if (filters.quarter) {
          filtered = filtered.filter((r) => r.quarter === filters.quarter);
        }

        return filtered;
      },

      checkDuplicatePeriod: (type, year, quarter) => {
        return get().records.find((r) => {
          if (r.type !== type || r.year !== year) {
            return false;
          }

          if (type === 'gst-bas') {
            return r.quarter === quarter;
          }

          // For company tax, only type and year matter
          return true;
        });
      },

      getSummary: (filters) => {
        const records = filters ? get().getFilteredLodgements(filters) : get().records;

        const lodgedRecords = records.filter((r) => r.status === 'lodged');
        const notLodgedRecords = records.filter((r) => r.status === 'not-lodged');

        const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
        const totalLodgedAmount = lodgedRecords.reduce((sum, r) => sum + r.amount, 0);
        const totalOutstandingAmount = notLodgedRecords.reduce((sum, r) => sum + r.amount, 0);

        // Find oldest outstanding
        const oldestOutstanding = notLodgedRecords.sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        )[0];

        // Find newest lodgement
        const newestLodgement = lodgedRecords
          .filter((r) => r.lodgementDate)
          .sort(
            (a, b) => new Date(b.lodgementDate!).getTime() - new Date(a.lodgementDate!).getTime(),
          )[0];

        return {
          totalRecords: records.length,
          lodgedCount: lodgedRecords.length,
          notLodgedCount: notLodgedRecords.length,
          totalAmount,
          totalLodgedAmount,
          totalOutstandingAmount,
          oldestOutstanding,
          newestLodgement,
        };
      },

      importRecords: (records) => {
        // Validate all records before importing
        const validated = records.map((r) => validateRecord(r));

        set({ records: validated });
      },

      clearAllRecords: () => {
        set({ records: [] });
      },
    }),
    {
      name: STORAGE_KEYS.LODGEMENT_HISTORY,
      version: 1,
      // Custom storage with validation on rehydration
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          try {
            const parsed = JSON.parse(str);
            // Validate each record on rehydration
            if (parsed.state?.records && Array.isArray(parsed.state.records)) {
              parsed.state.records = parsed.state.records
                .map((record: LodgementRecord) => {
                  try {
                    return validateRecord(record);
                  } catch {
                    // Skip invalid records
                    return null;
                  }
                })
                .filter(Boolean);
            }
            return parsed;
          } catch {
            // Corrupt data - return null to use defaults
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    },
  ),
);
