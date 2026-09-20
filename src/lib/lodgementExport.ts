/**
 * Lodgement CSV export — pure function, extracted from LodgementHistory.tsx
 * so the escaping logic is unit-testable.
 */
import type { LodgementRecord } from '@/types/lodgement';

const HEADERS = [
  'ID',
  'Type',
  'Year',
  'Quarter',
  'Status',
  'Due Date',
  'Lodgement Date',
  'Amount',
  'Late',
  'Days Late',
  'Has Penalty',
  'Penalty Amount',
  'Notes',
  'Source',
];

/** Escape a single CSV field: wrap in quotes and double any embedded quotes. */
function escapeField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Build a CSV string from lodgement records. */
export function toCsv(records: LodgementRecord[]): string {
  const rows = records.map((r) =>
    [
      r.id,
      r.type,
      r.year.toString(),
      r.quarter || '',
      r.status,
      r.dueDate,
      r.lodgementDate || '',
      r.amount.toFixed(2),
      r.isLate ? 'Yes' : 'No',
      r.daysLate?.toString() || '0',
      r.hasPenalty ? 'Yes' : 'No',
      r.penaltyAmount?.toFixed(2) || '0.00',
      escapeField(r.notes || ''),
      r.source || 'manual',
    ].join(','),
  );
  return [HEADERS.join(','), ...rows].join('\n');
}

/** Trigger a browser download of the CSV. */
export function downloadCsv(records: LodgementRecord[]): void {
  const csv = toCsv(records);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gstcalc-lodgements-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
