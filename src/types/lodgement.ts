export interface LodgementRecord {
  id: string; // Unique ID: lodg_timestamp_random
  type: 'gst-bas' | 'company-tax';
  year: number; // Financial year (e.g., 2024)
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4'; // Required for BAS only
  status: 'lodged' | 'not-lodged';
  dueDate: string; // ISO 8601
  lodgementDate?: string; // ISO 8601, required if lodged
  amount: number;
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
  oldestOutstanding?: LodgementRecord;
  newestLodgement?: LodgementRecord;
}

export interface LodgementFilters {
  type?: 'gst-bas' | 'company-tax';
  year?: number;
  status?: 'lodged' | 'not-lodged';
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}
