import type { FinancialYearRates, TaxBracket } from '@/types/ato';

export interface IncomeTaxBreakdown {
  taxableIncome: number;
  annualTax: number;
  averageRate: number;
  marginalRate: number;
  netAnnualIncome: number;
  weeklyTax: number;
  weeklyNetIncome: number;
  bracket: TaxBracket;
}

function getBracketForIncome(income: number, brackets: TaxBracket[]): TaxBracket {
  if (brackets.length === 0) {
    throw new Error('No tax brackets supplied');
  }

  let current = brackets[0];
  for (const bracket of brackets) {
    if (income >= bracket.threshold) {
      current = bracket;
    } else {
      break;
    }
  }

  return current;
}

export function calculateIncomeTax(income: number, year: FinancialYearRates): IncomeTaxBreakdown {
  const taxableIncome = Math.max(0, income);
  const bracket = getBracketForIncome(taxableIncome, year.taxBrackets);
  const inclusiveThreshold = bracket.threshold > 0 ? bracket.threshold - 1 : 0;
  const taxablePortion = Math.max(0, taxableIncome - inclusiveThreshold);
  const annualTax = Math.max(0, bracket.baseTax + taxablePortion * bracket.rate);
  const netAnnualIncome = taxableIncome - annualTax;
  const weeklyTax = annualTax / 52;
  const weeklyNetIncome = netAnnualIncome / 52;
  const averageRate = taxableIncome === 0 ? 0 : annualTax / taxableIncome;

  return {
    taxableIncome,
    annualTax,
    averageRate,
    marginalRate: bracket.rate,
    netAnnualIncome,
    weeklyTax,
    weeklyNetIncome,
    bracket,
  };
}

export function calculateWeeklyFromAnnual(income: number) {
  return income / 52;
}
