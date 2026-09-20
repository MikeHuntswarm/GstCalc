/**
 * ATO lodgement due-date rules — single source of truth.
 *
 * Reconciles the three previously copy-pasted implementations
 * (LodgementHistory, MissedLodgements, Reminders) and corrects the
 * company-tax date to the ATO standard.
 *
 * ATO references:
 * - BAS quarters: due 28th of the month after quarter end
 * - Individual income tax: 31 October following the income year
 * - Company tax (30 June year-end): 31 January following the income year
 *   (15th day of the 7th month after year end; ATO grants to 31 Jan)
 * - Super guarantee: 28th of the month after quarter end
 */

export type LodgementType = 'gst-bas' | 'company-tax' | 'income-tax';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

/** BAS quarter due dates, keyed by quarter. Year is the income-year start year. */
const BAS_DUE: Record<Quarter, (year: number) => string> = {
  Q1: (y) => `${y}-10-28`, // Jul-Sep → 28 Oct
  Q2: (y) => `${y + 1}-02-28`, // Oct-Dec → 28 Feb
  Q3: (y) => `${y + 1}-04-28`, // Jan-Mar → 28 Apr
  Q4: (y) => `${y + 1}-07-28`, // Apr-Jun → 28 Jul
};

/** Super guarantee quarter due dates (28th of month after quarter end). */
const SUPER_DUE: Record<Quarter, (year: number) => string> = {
  Q1: (y) => `${y}-10-28`,
  Q2: (y) => `${y + 1}-01-28`, // Oct-Dec → 28 Jan
  Q3: (y) => `${y + 1}-04-28`,
  Q4: (y) => `${y + 1}-07-28`,
};

/**
 * Due date for a lodgement type.
 * @param type gst-bas | company-tax | income-tax
 * @param quarter required for gst-bas, ignored otherwise
 * @param year the income-year start year (e.g. 2026 for FY 2026-27)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function dueDateFor(type: LodgementType, quarter: Quarter, year: number): string {
  if (type === 'gst-bas') {
    return BAS_DUE[quarter](year);
  }
  if (type === 'company-tax') {
    return companyTaxDueDate(year);
  }
  return incomeTaxDueDate(year);
}

/**
 * Due date for a super guarantee quarter.
 * @param quarter Q1-Q4
 * @param year the income-year start year
 */
export function superDueDate(quarter: Quarter, year: number): string {
  return SUPER_DUE[quarter](year);
}

/**
 * Due date for a company tax return (30 June year-end).
 * ATO: 31 January following the income year.
 */
export function companyTaxDueDate(year: number): string {
  return `${year + 1}-01-31`;
}

/**
 * Due date for an individual income tax return.
 * ATO: 31 October following the income year.
 */
export function incomeTaxDueDate(year: number): string {
  return `${year + 1}-10-31`;
}
