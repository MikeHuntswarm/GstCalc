import { describe, it, expect } from 'vitest';
import {
  getDueReminders,
  daysUntilDue,
  formatReminderDate,
  toInputDate,
  fromInputDate,
  reminderDueDate,
  CATEGORY_LABELS,
  CATEGORY_BADGE_LABELS,
} from './reminderDates';
import type { Reminder } from '../store/reminders';

function reminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'r1',
    label: 'BAS Q1',
    dueDate: '28 October 2026',
    category: 'bas',
    notifyDaysBefore: [7, 3, 1],
    ...overrides,
  };
}

describe('daysUntilDue', () => {
  it('returns the calendar-day difference', () => {
    const now = new Date('2026-10-21T00:00:00');
    expect(daysUntilDue('28 October 2026', now)).toBe(7);
  });

  it('returns null for unparseable dates', () => {
    expect(daysUntilDue('not a date', new Date())).toBeNull();
  });
});

describe('formatReminderDate', () => {
  it('formats a Date in the reminder format', () => {
    expect(formatReminderDate(new Date('2026-10-28T00:00:00'))).toBe('28 October 2026');
  });
});

describe('toInputDate / fromInputDate', () => {
  it('converts a reminder date string to yyyy-MM-dd for an input[type=date]', () => {
    expect(toInputDate('28 October 2026')).toBe('2026-10-28');
  });

  it('returns empty string for unparseable reminder dates', () => {
    expect(toInputDate('garbage')).toBe('');
  });

  it('converts an input value back to the reminder format', () => {
    expect(fromInputDate('2026-10-28')).toBe('28 October 2026');
  });

  it('returns null for unparseable input values', () => {
    expect(fromInputDate('not-a-date')).toBeNull();
  });
});

describe('reminderDueDate', () => {
  it('derives a BAS due date from quarter and year', () => {
    expect(reminderDueDate('bas', 'Q1', 2026)).toBe('2026-10-28');
  });

  it('derives a tax return due date from year only', () => {
    expect(reminderDueDate('tax_return', '', 2026)).toBe('2027-10-31');
  });

  it('derives a superannuation due date from quarter and year', () => {
    expect(reminderDueDate('superannuation', 'Q2', 2026)).toBe('2027-01-28');
  });

  it('returns empty for custom categories', () => {
    expect(reminderDueDate('custom', 'Q1', 2026)).toBe('');
  });

  it('returns empty when quarter is missing for a quarter-based category', () => {
    expect(reminderDueDate('bas', '', 2026)).toBe('');
  });
});

describe('category labels', () => {
  it('uses Reminder in notification titles for custom', () => {
    expect(CATEGORY_LABELS.custom).toBe('Reminder');
  });

  it('uses Custom on the badge for custom', () => {
    expect(CATEGORY_BADGE_LABELS.custom).toBe('Custom');
  });

  it('keeps the non-custom labels aligned', () => {
    for (const c of ['bas', 'tax_return', 'superannuation'] as const) {
      expect(CATEGORY_BADGE_LABELS[c]).toBe(CATEGORY_LABELS[c]);
    }
  });
});

describe('getDueReminders', () => {
  it('returns reminders whose notifyDaysBefore matches today', () => {
    const now = new Date('2026-10-21T00:00:00'); // 7 days before 28 Oct
    const due = getDueReminders([reminder()], now);
    expect(due).toHaveLength(1);
    expect(due[0].title).toBe('Upcoming BAS Lodgement');
    expect(due[0].body).toContain('BAS Q1');
  });

  it('does not fire for reminders not in the notify window', () => {
    const now = new Date('2026-10-20T00:00:00'); // 8 days before — not in [7,3,1]
    expect(getDueReminders([reminder()], now)).toHaveLength(0);
  });

  it('skips reminders with unparseable dates', () => {
    const now = new Date('2026-10-21T00:00:00');
    expect(getDueReminders([reminder({ dueDate: 'garbage' })], now)).toHaveLength(0);
  });

  it('handles multiple reminders with different categories', () => {
    const now = new Date('2026-10-21T00:00:00');
    const due = getDueReminders(
      [
        reminder({ id: 'a', category: 'bas' }),
        reminder({ id: 'b', category: 'superannuation', dueDate: '21 October 2026' }),
      ],
      now,
    );
    // b is due today (0 days) but 0 is not in [7,3,1]; a is 7 days → due
    expect(due).toHaveLength(1);
    expect(due[0].reminder.id).toBe('a');
  });
});
