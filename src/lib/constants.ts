/**
 * Application-wide constants
 */

// Time constants
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

// Cache settings
export const CACHE_EXPIRY_DAYS = 7;
export const CACHE_EXPIRY_MS = CACHE_EXPIRY_DAYS * MS_PER_DAY;

// Storage keys
export const STORAGE_KEYS = {
  ATO_RATES: 'gstcalc-ato-rates',
  REMINDERS: 'gstcalc-reminders',
  GST_SCENARIOS: 'gstcalc-gst-scenarios',
  INCOME_SCENARIOS: 'gstcalc-income-scenarios',
  THEME: 'gstcalc-theme',
  SETTINGS: 'gstcalc-settings',
  DEBUG_MODE: 'gstcalc-debug',
  LODGEMENT_HISTORY: 'gstcalc-lodgement-history',
} as const;

// Limits
export const MAX_SAVED_SCENARIOS = 10;
export const MAX_CALCULATION_HISTORY = 20;
export const NOTIFICATION_ADVANCE_DAYS = [7, 3, 1, 0] as const;

// Default values
export const DEFAULT_GST_RATE = 0.1; // 10%
export const DEFAULT_CURRENCY_LOCALE = 'en-AU';
export const DEFAULT_CURRENCY = 'AUD';

// URL patterns
export const ALLOWED_ATO_DOMAINS = [
  'raw.githubusercontent.com',
  'github.com',
  'api.github.com',
] as const;

// UI constants
export const TOAST_DURATION = 3000; // 3 seconds
export const DEBOUNCE_DELAY = 300; // milliseconds
export const NOTIFICATION_COOLDOWN = 1000; // 1 second

// Validation limits
export const MAX_INCOME_AMOUNT = 10_000_000; // $10 million
export const MIN_INCOME_AMOUNT = 0;
export const MAX_GST_RATE = 1; // 100%
export const MIN_GST_RATE = 0;

// Financial year settings
export const FINANCIAL_YEAR_START_MONTH = 6; // July (0-indexed)
export const FINANCIAL_YEAR_START_DAY = 1;

// Reminder categories
export const REMINDER_CATEGORIES = ['BAS', 'Tax Return', 'Superannuation', 'Custom'] as const;
export type ReminderCategory = (typeof REMINDER_CATEGORIES)[number];

// Tax thresholds (these are examples - actual values should come from ATO data)
export const SUPER_GUARANTEE_RATE = 0.115; // 11.5% as of July 2024
export const COMPANY_TAX_FULL_RATE = 0.3; // 30%
export const COMPANY_TAX_BASE_RATE = 0.25; // 25%

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  VALIDATION_ERROR: 'Invalid data. Please check your inputs.',
  STORAGE_ERROR: 'Failed to save data. Please try again.',
  FETCH_ERROR: 'Failed to fetch data. Using cached version.',
  UNAUTHORIZED_DOMAIN: 'Unauthorized data source.',
} as const;
