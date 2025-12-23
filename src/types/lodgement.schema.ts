import { z } from 'zod';

export const LodgementRecordSchema = z
  .object({
    id: z.string().min(1, 'ID is required'),
    type: z.enum(['gst-bas', 'company-tax'], {
      errorMap: () => ({ message: 'Type must be either gst-bas or company-tax' }),
    }),
    year: z
      .number()
      .int('Year must be an integer')
      .min(2000, 'Year must be 2000 or later')
      .max(2100, 'Year must be 2100 or earlier'),
    quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).optional(),
    status: z.enum(['lodged', 'not-lodged'], {
      errorMap: () => ({ message: 'Status must be either lodged or not-lodged' }),
    }),
    dueDate: z.string().datetime('Due date must be a valid ISO 8601 date'),
    lodgementDate: z.string().datetime('Lodgement date must be a valid ISO 8601 date').optional(),
    amount: z.number().finite('Amount must be a finite number'),
    notes: z.string().optional(),
    createdAt: z.string().datetime('Created date must be a valid ISO 8601 date'),
    updatedAt: z.string().datetime('Updated date must be a valid ISO 8601 date'),
    source: z.enum(['manual', 'converted-from-missed']).optional(),
  })
  .refine(
    (data) => {
      // BAS must have quarter, company tax must not
      if (data.type === 'gst-bas') {
        return data.quarter !== undefined;
      }
      return data.quarter === undefined;
    },
    {
      message: 'BAS records must have a quarter, company tax records must not',
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
  );

export const LodgementFiltersSchema = z.object({
  type: z.enum(['gst-bas', 'company-tax']).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  status: z.enum(['lodged', 'not-lodged']).optional(),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).optional(),
});

export type ValidatedLodgementRecord = z.infer<typeof LodgementRecordSchema>;
export type ValidatedLodgementFilters = z.infer<typeof LodgementFiltersSchema>;
