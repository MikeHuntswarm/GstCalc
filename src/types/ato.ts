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

export interface AtoRates {
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
}
