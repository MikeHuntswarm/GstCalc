import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getDueReminders,
  formatReminderDate,
  daysUntilDue,
  type DueReminder,
} from '@/lib/reminderDates';

export type ReminderCategory = 'bas' | 'tax_return' | 'superannuation' | 'custom';

export interface Reminder {
  id: string;
  label: string;
  dueDate: string; // Format: 'd MMMM yyyy'
  category: ReminderCategory;
  notifyDaysBefore: number[];
  notes?: string;
}

interface RemindersState {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateReminder: (id: string, updates: Partial<Omit<Reminder, 'id'>>) => void;
  removeReminder: (id: string) => void;
  /** Pure: returns which reminders are due to be notified. Caller fires notifications. */
  checkDueReminders: () => DueReminder[];
  getReminderById: (id: string) => Reminder | undefined;
  getRemindersByCategory: (category: ReminderCategory) => Reminder[];
  getUpcomingReminders: (daysAhead: number) => Reminder[];
}

// Helper function to generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create the store with persistence
export const useRemindersStore = create<RemindersState>()(
  persist(
    (set, get) => ({
      reminders: [],

      addReminder: (reminder) => {
        const newReminder = {
          ...reminder,
          id: generateId(),
        };
        set((state) => ({
          reminders: [...state.reminders, newReminder],
        }));
      },

      updateReminder: (id, updates) => {
        set((state) => ({
          reminders: state.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        }));
      },

      removeReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        }));
      },

      checkDueReminders: () => {
        return getDueReminders(get().reminders);
      },

      getReminderById: (id) => {
        return get().reminders.find((r) => r.id === id);
      },

      getRemindersByCategory: (category) => {
        return get().reminders.filter((r) => r.category === category);
      },

      getUpcomingReminders: (daysAhead) => {
        const { reminders } = get();
        const now = new Date();

        return reminders
          .filter((reminder) => {
            const days = daysUntilDue(reminder.dueDate, now);
            return days !== null && days >= 0 && days <= daysAhead;
          })
          .sort((a, b) => {
            const da = daysUntilDue(a.dueDate, now) ?? 0;
            const db = daysUntilDue(b.dueDate, now) ?? 0;
            return da - db;
          });
      },
    }),
    {
      name: 'gstcalc-reminders',
    },
  ),
);

export { formatReminderDate };
