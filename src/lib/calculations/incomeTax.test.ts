import { describe, it, expect } from 'vitest';
import { calculateIncomeTax } from './incomeTax';
import type { FinancialYearRates } from '@/types/ato';
import atoRates from '../../../data/ato-rates.json';

const financialYears = (atoRates as { individual: { financialYears: FinancialYearRates[] } }).individual
  .financialYears;

function getRates(year: string): FinancialYearRates {
  const match = financialYears.find((fy) => fy.year === year);

  if (!match) {
    throw new Error(`Financial year ${year} not found in dataset`);
  }

  return match;
}

describe('calculateIncomeTax threshold handling', () => {
  const scenarios: Array<{
    year: string;
    cases: Array<{ income: number; expectedTax: number }>;
  }> = [
    {
      year: '2024-25',
      cases: [
        { income: 18_201, expectedTax: 0.16 },
        { income: 45_001, expectedTax: 4_288.3 },
        { income: 135_001, expectedTax: 31_288.37 },
        { income: 190_001, expectedTax: 51_638.45 }
      ]
    },
    {
      year: '2023-24',
      cases: [
        { income: 18_201, expectedTax: 0.19 },
        { income: 45_001, expectedTax: 5_092.325 },
        { income: 120_001, expectedTax: 29_467.37 },
        { income: 180_001, expectedTax: 51_667.45 }
      ]
    }
  ];

  for (const { year, cases } of scenarios) {
    const rates = getRates(year);

    describe(`financial year ${year}`, () => {
      for (const { income, expectedTax } of cases) {
        it(`matches ATO tax for taxable income ${income.toLocaleString('en-AU')}`, () => {
          const result = calculateIncomeTax(income, rates);

          expect(result.annualTax).toBeCloseTo(expectedTax, 6);
        });
      }
    });
  }
});
