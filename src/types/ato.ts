export interface TaxBracket {
  threshold: number;
  baseTax: number;
  rate: number;
}

export interface FinancialYearRates {
  year: string;
  effectiveFrom: string;
  taxBrackets: TaxBracket[];
}

export interface GstRates {
  standardRate: number;
  notes: string;
}

export interface CompanyRate {
  rate: number;
  criteria: string;
  baseRateTurnoverCap?: number;
  passiveIncomeMaxPercent?: number;
}

export interface PenaltySchedule {
  failureToLodge: {
    unitValue: number;
    maxUnits: number;
    frequencyDays: number;
    description: string;
  };
  generalInterestCharge: {
    description: string;
  };
}

export interface BasQuarter {
  label: string;
  period: string;
  standardDueDate: string;
  notes?: string;
}

export interface AnnualObligation {
  name: string;
  dueDate: string;
  notes?: string;
}

export interface LodgementSchedule {
  basQuarters: BasQuarter[];
  annualObligations: AnnualObligation[];
}

export interface TaxStrategy {
  title: string;
  summary: string;
  actions: string[];
  caution?: string;
}

export interface TaxPlanning {
  disclaimer: string;
  strategies: TaxStrategy[];
}

export interface AtoData {
  metadata: {
    source: string;
    lastUpdated: string;
  };
  gst: GstRates;
  individual: {
    financialYears: FinancialYearRates[];
  };
  company: {
    baseRateEntity: CompanyRate;
    fullRate: CompanyRate;
  };
  penalties: PenaltySchedule;
  lodgements?: LodgementSchedule;
  taxPlanning?: TaxPlanning;
}
