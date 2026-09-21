import { describe, it, expect } from 'vitest';
import { getDueReminders, daysUntilDue, formatReminderDate } from './reminderDates';
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
