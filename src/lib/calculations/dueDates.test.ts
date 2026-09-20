import { describe, expect, it } from 'vitest';
import { dueDateFor, superDueDate, companyTaxDueDate, incomeTaxDueDate } from './dueDates';

describe('BAS quarter due dates', () => {
  it('applies Q1 due 28 October of the income year', () => {
    expect(dueDateFor('gst-bas', 'Q1', 2026)).toBe('2026-10-28');
  });

  it('applies Q2 due 28 February of the following year', () => {
    expect(dueDateFor('gst-bas', 'Q2', 2026)).toBe('2027-02-28');
  });

  it('applies Q3 due 28 April of the following year', () => {
    expect(dueDateFor('gst-bas', 'Q3', 2026)).toBe('2027-04-28');
  });

  it('applies Q4 due 28 July of the following year', () => {
    expect(dueDateFor('gst-bas', 'Q4', 2026)).toBe('2027-07-28');
  });
});

describe('Income tax due date', () => {
  it('is 31 October following the income year', () => {
    expect(dueDateFor('income-tax', 'Q1', 2026)).toBe('2027-10-31');
    expect(incomeTaxDueDate(2026)).toBe('2027-10-31');
  });
});

describe('Company tax due date', () => {
  it('is 31 January following the income year (ATO standard)', () => {
    expect(dueDateFor('company-tax', 'Q1', 2026)).toBe('2027-01-31');
    expect(companyTaxDueDate(2026)).toBe('2027-01-31');
  });
});

describe('Super guarantee due dates', () => {
  it('applies Q1 due 28 October of the income year', () => {
    expect(superDueDate('Q1', 2026)).toBe('2026-10-28');
  });

  it('applies Q2 due 28 January of the following year (six-week window)', () => {
    expect(superDueDate('Q2', 2026)).toBe('2027-01-28');
  });

  it('applies Q3 due 28 April of the following year', () => {
    expect(superDueDate('Q3', 2026)).toBe('2027-04-28');
  });

  it('applies Q4 due 28 July of the following year', () => {
    expect(superDueDate('Q4', 2026)).toBe('2027-07-28');
  });
});
