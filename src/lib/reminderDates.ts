/**
 * Reminder date helpers — pure functions extracted from store/reminders.ts
 * so the due-detection logic is unit-testable without firing notifications.
 */
import { parse, differenceInCalendarDays, format } from 'date-fns';
import {
  dueDateFor,
  superDueDate,
  incomeTaxDueDate,
  type Quarter,
} from '@/lib/calculations/dueDates';
import type { Reminder, ReminderCategory } from '@/store/reminders';

export const REMINDER_DATE_FORMAT = 'd MMMM yyyy';

/**
 * Category labels used in notification titles.
 * NOTE: `custom` intentionally renders as 'Reminder' in titles; the card badge
 * uses CATEGORY_BADGE_LABELS (where custom renders as 'Custom').
 */
export const CATEGORY_LABELS: Record<ReminderCategory, string> = {
  bas: 'BAS Lodgement',
  tax_return: 'Tax Return',
  superannuation: 'Superannuation',
  custom: 'Reminder',
};

/** Category labels used on the card badge. Kept beside CATEGORY_LABELS so the fork lives in one module. */
export const CATEGORY_BADGE_LABELS: Record<ReminderCategory, string> = {
  ...CATEGORY_LABELS,
  custom: 'Custom',
};

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

/** Convert a reminder date string to the yyyy-MM-dd an <input type="date"> needs. */
export function toInputDate(dueDate: string): string {
  const parsed = parseReminderDate(dueDate);
  return parsed ? format(parsed, 'yyyy-MM-dd') : '';
}

/** Convert an <input type="date"> value (yyyy-MM-dd) to a reminder date string. Returns null if unparseable. */
export function fromInputDate(input: string): string | null {
  try {
    const d = parse(input, 'yyyy-MM-dd', new Date());
    return isNaN(d.getTime()) ? null : format(d, REMINDER_DATE_FORMAT);
  } catch {
    return null;
  }
}

/**
 * Due date for a reminder category, given the quarter and income-year start year.
 * Returns '' for categories that don't auto-derive a date (custom) or when the
 * quarter is missing for a quarter-based category.
 */
export function reminderDueDate(category: ReminderCategory, quarter: string, year: number): string {
  switch (category) {
    case 'bas':
      return quarter ? dueDateFor('gst-bas', quarter as Quarter, year) : '';
    case 'tax_return':
      return incomeTaxDueDate(year);
    case 'superannuation':
      return quarter ? superDueDate(quarter as Quarter, year) : '';
    default:
      return '';
  }
}

export interface DueReminder {
  reminder: Reminder;
  daysUntilDue: number;
  title: string;
  body: string;
}

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
