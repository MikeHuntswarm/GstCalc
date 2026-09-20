/**
 * Lodgement bulk-import helpers — pure functions extracted from
 * LodgementHistory.tsx so the date conversion and import counting are
 * unit-testable.
 */
import type { LodgementRecord } from '@/types/lodgement';

/** Convert a YYYY-MM-DD date string to a full ISO timestamp (UTC, timezone-safe). */
export function toIsoDate(dateStr: string): string {
  // Parse as UTC so the date is preserved regardless of the user's local timezone
  // (new Date('YYYY-MM-DD') is parsed as local midnight, which shifts the day in non-UTC zones)
  return new Date(`${dateStr}T00:00:00Z`).toISOString();
}

export interface ImportResult {
  success: number;
  skipped: number;
  errors: number;
}

/**
 * Import a batch of records, counting outcomes.
 * @param records records to import (dates as YYYY-MM-DD)
 * @param addFn the store's addLodgement (throws on duplicate/invalid)
 */
export function importRecords(
  records: Array<Omit<LodgementRecord, 'id' | 'createdAt' | 'updatedAt'>>,
  addFn: (record: Omit<LodgementRecord, 'id' | 'createdAt' | 'updatedAt'>) => LodgementRecord,
): ImportResult {
  const result: ImportResult = { success: 0, skipped: 0, errors: 0 };

  for (const record of records) {
    try {
      const recordWithIso = {
        ...record,
        dueDate: toIsoDate(record.dueDate),
        lodgementDate: record.lodgementDate ? toIsoDate(record.lodgementDate) : undefined,
        source: 'manual' as const,
      };
      addFn(recordWithIso);
      result.success++;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('already exists')) {
        result.skipped++;
      } else {
        result.errors++;
        console.error('Import error:', error);
      }
    }
  }

  return result;
}
