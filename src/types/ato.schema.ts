import { z } from 'zod';

// Zod schemas for runtime validation of ATO data
const TaxBracketSchema = z.object({
  threshold: z.number(),
  baseTax: z.number(),
  rate: z.number(),
});

const FinancialYearRatesSchema = z.object({
  year: z.string(),
  effectiveFrom: z.string(),
  taxBrackets: z.array(TaxBracketSchema),
});

const MedicareLevyConfigSchema = z.object({
  levyRate: z.number(),
  lowIncomeThreshold: z.number(),
  taperRate: z.number(),
  familyThreshold: z.number().optional(),
  notes: z.string().optional(),
});

const OffsetSchema = z.object({
  name: z.string(),
  description: z.string(),
  maxAmount: z.number(),
  incomeLimit: z.number().optional(),
});

const GstRatesSchema = z.object({
  standardRate: z.number(),
  notes: z.string(),
});

const CompanyRateSchema = z.object({
  rate: z.number(),
  criteria: z.string(),
  baseRateTurnoverCap: z.number().optional(),
  passiveIncomeMaxPercent: z.number().optional(),
});

const PenaltyScheduleSchema = z.object({
  failureToLodge: z.object({
    unitValue: z.number(),
    maxUnits: z.number(),
    frequencyDays: z.number(),
    description: z.string(),
  }),
  generalInterestCharge: z.object({
    description: z.string(),
  }),
});

const BasQuarterSchema = z.object({
  label: z.string(),
  period: z.string(),
  standardDueDate: z.string(),
  notes: z.string().optional(),
});

const AnnualObligationSchema = z.object({
  name: z.string(),
  dueDate: z.string(),
  notes: z.string().optional(),
});

const LodgementScheduleSchema = z.object({
  basQuarters: z.array(BasQuarterSchema),
  annualObligations: z.array(AnnualObligationSchema),
});

const TaxStrategySchema = z.object({
  title: z.string(),
  summary: z.string(),
  actions: z.array(z.string()),
  caution: z.string().optional(),
});

const TaxPlanningSchema = z.object({
  disclaimer: z.string(),
  strategies: z.array(TaxStrategySchema),
});

const InstantAssetWriteOffSchema = z.object({
  threshold: z.number(),
  effectivePeriod: z.string(),
  eligibility: z.string(),
  notes: z.string().optional(),
});

const SimplifiedDepreciationPoolSchema = z.object({
  threshold: z.number(),
  firstYearRate: z.number(),
  subsequentRate: z.number(),
  eligibility: z.string(),
  notes: z.string().optional(),
});

const SmallBusinessConcessionsSchema = z.object({
  instantAssetWriteOff: InstantAssetWriteOffSchema,
  simplifiedDepreciation: SimplifiedDepreciationPoolSchema,
  reminder: z.string().optional(),
});

const InterestRatePeriodSchema = z.object({
  label: z.string(),
  rate: z.number(),
  effectiveFrom: z.string(),
  effectiveTo: z.string(),
});

const InterestRatesSchema = z.object({
  generalInterestCharge: z.object({
    description: z.string(),
    quarterlyRates: z.array(InterestRatePeriodSchema),
  }),
  benchmarkInterest: z
    .object({
      description: z.string(),
      frankingNotes: z.string().optional(),
      quarterlyRates: z.array(InterestRatePeriodSchema),
    })
    .optional(),
});

export const AtoDataSchema = z.object({
  metadata: z.object({
    source: z.string(),
    lastUpdated: z.string(),
  }),
  gst: GstRatesSchema,
  individual: z.object({
    financialYears: z.array(FinancialYearRatesSchema),
    medicare: MedicareLevyConfigSchema.optional(),
    offsets: z.array(OffsetSchema).optional(),
  }),
  company: z.object({
    baseRateEntity: CompanyRateSchema,
    fullRate: CompanyRateSchema,
  }),
  penalties: PenaltyScheduleSchema,
  lodgements: LodgementScheduleSchema.optional(),
  taxPlanning: TaxPlanningSchema.optional(),
  smallBusiness: SmallBusinessConcessionsSchema.optional(),
  interestRates: InterestRatesSchema.optional(),
});

export type AtoDataValidated = z.infer<typeof AtoDataSchema>;
