export interface LodgementRecord {
  id: string; // Unique ID: lodg_timestamp_random
  type: 'gst-bas' | 'company-tax' | 'income-tax';
  year: number; // Financial year (e.g., 2024)
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4'; // Required for BAS only
  status: 'lodged' | 'not-lodged';
  dueDate: string; // ISO 8601
  lodgementDate?: string; // ISO 8601, required if lodged
  amount: number;
  isLate?: boolean; // Whether lodgement was submitted late
  daysLate?: number; // Number of days late (if applicable)
  hasPenalty?: boolean; // Whether ATO penalty/fine was applied
  penaltyAmount?: number; // Amount of penalty/fine if applicable
  notes?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  source?: 'manual' | 'converted-from-missed';
}

export interface LodgementSummary {
  totalRecords: number;
  lodgedCount: number;
  notLodgedCount: number;
  totalAmount: number;
  totalLodgedAmount: number;
  totalOutstandingAmount: number;
  lateCount: number;
  totalDaysLate: number;
  totalPenalties: number;
  penaltyCount: number;
  oldestOutstanding?: LodgementRecord;
  newestLodgement?: LodgementRecord;
}

export interface LodgementFilters {
  type?: 'gst-bas' | 'company-tax' | 'income-tax';
  year?: number;
  status?: 'lodged' | 'not-lodged';
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  hasPenalty?: boolean;
}
