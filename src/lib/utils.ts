import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, options: Intl.NumberFormatOptions = {}) {
  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    ...options,
  });

  return formatter.format(value);
}

export function formatPercent(value: number, options: Intl.NumberFormatOptions = {}) {
  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'percent',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  });

  return formatter.format(value);
}
