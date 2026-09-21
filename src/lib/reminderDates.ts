/**
 * Reminder date helpers — pure functions extracted from store/reminders.ts
 * so the due-detection logic is unit-testable without firing notifications.
 */
import { parse, differenceInCalendarDays, format } from 'date-fns';
import type { Reminder, ReminderCategory } from '@/store/reminders';

export const REMINDER_DATE_FORMAT = 'd MMMM yyyy';

/** Parse a reminder date string ('d MMMM yyyy'). Returns null on failure. */
export function parseReminderDate(dateString: string): Date | null {
  try {
    const d = parse(dateString, REMINDER_DATE_FORMAT, new Date());
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/** Format a Date as a reminder date string ('d MMMM yyyy'). */
export function formatReminderDate(date: Date): string {
  return format(date, REMINDER_DATE_FORMAT);
}

/** Whole calendar days from now until the due date (negative = overdue). */
export function daysUntilDue(dueDate: string, now = new Date()): number | null {
  const parsed = parseReminderDate(dueDate);
  if (!parsed) return null;
  return differenceInCalendarDays(parsed, now);
}

export interface DueReminder {
  reminder: Reminder;
  daysUntilDue: number;
  title: string;
  body: string;
}

const CATEGORY_LABELS: Record<ReminderCategory, string> = {
  bas: 'BAS Lodgement',
  tax_return: 'Tax Return',
  superannuation: 'Superannuation',
  custom: 'Reminder',
};

/**
 * Which reminders are due to be notified today, given their notifyDaysBefore
 * settings. Pure — returns the payloads; the caller decides how to deliver.
 */
export function getDueReminders(reminders: Reminder[], now = new Date()): DueReminder[] {
  const due: DueReminder[] = [];

  for (const reminder of reminders) {
    if (!reminder.dueDate) continue;

    const days = daysUntilDue(reminder.dueDate, now);
    if (days === null) continue;

    if (reminder.notifyDaysBefore.includes(days)) {
      due.push({
        reminder,
        daysUntilDue: days,
        title: `Upcoming ${CATEGORY_LABELS[reminder.category]}`,
        body: `Your ${reminder.label} is due in ${days} days.`,
      });
    }
  }

  return due;
}
