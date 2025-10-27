import type { FinancialYearRates, MedicareLevyConfig, TaxBracket } from '@/types/ato';

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

export interface MedicareLevyBreakdown {
  amount: number;
  effectiveRate: number;
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

export function calculateMedicareLevy(
  income: number,
  config?: MedicareLevyConfig,
): MedicareLevyBreakdown {
  if (!config) {
    return { amount: 0, effectiveRate: 0 };
  }

  const taxableIncome = Math.max(0, income);
  const { levyRate, lowIncomeThreshold, taperRate } = config;

  if (taxableIncome <= lowIncomeThreshold) {
    return { amount: 0, effectiveRate: 0 };
  }

  const phasedLevy = (taxableIncome - lowIncomeThreshold) * taperRate;
  const fullLevy = taxableIncome * levyRate;
  const amount = Math.min(Math.max(phasedLevy, 0), fullLevy);
  const effectiveRate = taxableIncome > 0 ? amount / taxableIncome : 0;

  return { amount, effectiveRate };
}
