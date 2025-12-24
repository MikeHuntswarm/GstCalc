import { z } from 'zod';

export const LodgementRecordSchema = z
  .object({
    id: z.string().min(1, 'ID is required'),
    type: z.enum(['gst-bas', 'company-tax', 'income-tax'], {
      message: 'Type must be gst-bas, company-tax, or income-tax',
    }),
    year: z
      .number()
      .int('Year must be an integer')
      .min(2000, 'Year must be 2000 or later')
      .max(2100, 'Year must be 2100 or earlier'),
    quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).optional(),
    status: z.enum(['lodged', 'not-lodged'], {
      message: 'Status must be either lodged or not-lodged',
    }),
    dueDate: z.string().datetime('Due date must be a valid ISO 8601 date'),
    lodgementDate: z.string().datetime('Lodgement date must be a valid ISO 8601 date').optional(),
    amount: z.number().finite('Amount must be a finite number'),
    hasPenalty: z.boolean().optional(),
    penaltyAmount: z
      .number()
      .finite('Penalty amount must be a finite number')
      .positive('Penalty amount must be positive')
      .optional(),
    notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
    createdAt: z.string().datetime('Created date must be a valid ISO 8601 date'),
    updatedAt: z.string().datetime('Updated date must be a valid ISO 8601 date'),
    source: z.enum(['manual', 'converted-from-missed']).optional(),
  })
  .refine(
    (data) => {
      // BAS must have quarter, company/income tax must not
      if (data.type === 'gst-bas') {
        return data.quarter !== undefined;
      }
      return data.quarter === undefined;
    },
    {
      message: 'BAS records must have a quarter, company/income tax records must not',
      path: ['quarter'],
    },
  )
  .refine(
    (data) => {
      // Lodged status requires lodgementDate
      if (data.status === 'lodged') {
        return data.lodgementDate !== undefined && data.lodgementDate.length > 0;
      }
      return true;
    },
    {
      message: 'Lodgement date is required when status is lodged',
      path: ['lodgementDate'],
    },
  )
  .refine(
    (data) => {
      // Penalty consistency: hasPenalty=true requires penaltyAmount > 0
      if (data.hasPenalty === true) {
        return data.penaltyAmount !== undefined && data.penaltyAmount > 0;
      }
      // If penalty flag is explicitly false, penalty amount should not be set
      // Note: We allow undefined hasPenalty with undefined penaltyAmount (existing records)
      if (
        data.hasPenalty === false &&
        data.penaltyAmount !== undefined &&
        data.penaltyAmount !== null
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'Penalty amount is required and must be positive when penalty flag is set, and should not be set when penalty flag is false',
      path: ['penaltyAmount'],
    },
  )
  .refine(
    (data) => {
      // Lodgement date cannot be in the future
      if (data.lodgementDate) {
        return new Date(data.lodgementDate) <= new Date();
      }
      return true;
    },
    {
      message: 'Lodgement date cannot be in the future',
      path: ['lodgementDate'],
    },
  );

export const LodgementFiltersSchema = z.object({
  type: z.enum(['gst-bas', 'company-tax', 'income-tax']).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  status: z.enum(['lodged', 'not-lodged']).optional(),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).optional(),
  hasPenalty: z.boolean().optional(),
});

export type ValidatedLodgementRecord = z.infer<typeof LodgementRecordSchema>;
export type ValidatedLodgementFilters = z.infer<typeof LodgementFiltersSchema>;
