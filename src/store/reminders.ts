import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parse, differenceInCalendarDays, format } from 'date-fns';
import { sendNotification } from '@/lib/notifications';

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
  checkDueReminders: () => void;
  getReminderById: (id: string) => Reminder | undefined;
  getRemindersByCategory: (category: ReminderCategory) => Reminder[];
  getUpcomingReminders: (daysAhead: number) => Reminder[];
}

// Helper function to generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper function to parse a date string in the format 'd MMMM yyyy'
const parseDate = (dateString: string) => {
  try {
    return parse(dateString, 'd MMMM yyyy', new Date());
  } catch (error) {
    console.error(`Failed to parse date: ${dateString}`, error);
    return new Date();
  }
};

// Helper to format a date as 'd MMMM yyyy'
export const formatReminderDate = (date: Date) => {
  return format(date, 'd MMMM yyyy');
};

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
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },
      
      removeReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        }));
      },
      
      checkDueReminders: () => {
        const { reminders } = get();
        const now = new Date();
        
        reminders.forEach((reminder) => {
          if (!reminder.dueDate) return;
          
          const dueDate = parseDate(reminder.dueDate);
          const daysUntilDue = differenceInCalendarDays(dueDate, now);
          
          // Check if we need to notify based on the notifyDaysBefore settings
          if (reminder.notifyDaysBefore.includes(daysUntilDue)) {
            const categoryLabels: Record<ReminderCategory, string> = {
              bas: 'BAS Lodgement',
              tax_return: 'Tax Return',
              superannuation: 'Superannuation',
              custom: 'Reminder',
            };
            
            const title = `Upcoming ${categoryLabels[reminder.category]}`;
            const body = `Your ${reminder.label} is due in ${daysUntilDue} days.`;
            
            sendNotification(title, body);
          }
        });
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
        
        return reminders.filter((reminder) => {
          const dueDate = parseDate(reminder.dueDate);
          const daysUntilDue = differenceInCalendarDays(dueDate, now);
          return daysUntilDue >= 0 && daysUntilDue <= daysAhead;
        }).sort((a, b) => {
          const dueDateA = parseDate(a.dueDate);
          const dueDateB = parseDate(b.dueDate);
          return dueDateA.getTime() - dueDateB.getTime();
        });
      },
    }),
    {
      name: 'gstcalc-reminders',
    }
  )
);