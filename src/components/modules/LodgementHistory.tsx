import { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileTextIcon,
  PlusIcon,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Filter,
  AlertTriangle,
  DownloadIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLodgementHistoryStore } from '@/store/lodgementHistory';
import { useAtoStore } from '@/store/ato';
import { assessInvestigationRisk } from '@/lib/calculations/atoInvestigationRisk';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { LodgementRecord } from '@/types/lodgement';
import { InvestigationRiskPanel } from './InvestigationRiskPanel';
import { BAS_HISTORY_IMPORT, INCOME_TAX_IMPORT } from '@/data/bas-history-import';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

export function LodgementHistory() {
  const { records, addLodgement, updateLodgement, removeLodgement, getSummary } =
    useLodgementHistoryStore();
  const { data: atoData } = useAtoStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Auto-import income tax records on mount if they don't exist
  useEffect(() => {
    const hasIncomeTax = records.some((r) => r.type === 'income-tax');
    if (!hasIncomeTax && INCOME_TAX_IMPORT.length > 0) {
      INCOME_TAX_IMPORT.forEach((record) => {
        try {
          const recordWithIso = {
            ...record,
            dueDate: new Date(record.dueDate + 'T00:00:00').toISOString(),
            lodgementDate: new Date(record.lodgementDate + 'T00:00:00').toISOString(),
            source: 'manual' as const,
          };
          addLodgement(recordWithIso);
        } catch (error) {
          console.error('Failed to auto-import income tax record:', error);
        }
      });
    }
  }, []); // Empty deps array = run once on mount

  // Form state
  const [formType, setFormType] = useState<'gst-bas' | 'company-tax' | 'income-tax'>('gst-bas');
  const [formQuarter, setFormQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formStatus, setFormStatus] = useState<'lodged' | 'not-lodged'>('lodged');
  const [formDueDate, setFormDueDate] = useState('');
  const [formLodgementDate, setFormLodgementDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formHasPenalty, setFormHasPenalty] = useState(false);
  const [formPenaltyAmount, setFormPenaltyAmount] = useState('');

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'gst-bas' | 'company-tax' | 'income-tax' | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<'lodged' | 'not-lodged' | ''>('');
  const [filterQuarter, setFilterQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | ''>('');
  const [filterHasPenalty, setFilterHasPenalty] = useState<boolean | ''>('');

  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    if (filterType) {
      filtered = filtered.filter((r) => r.type === filterType);
    }

    if (filterYear) {
      filtered = filtered.filter((r) => r.year === filterYear);
    }

    if (filterStatus) {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    if (filterQuarter && filterType === 'gst-bas') {
      filtered = filtered.filter((r) => r.quarter === filterQuarter);
    }

    if (filterHasPenalty !== '') {
      filtered = filtered.filter((r) => r.hasPenalty === filterHasPenalty);
    }

    return filtered.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [records, filterType, filterYear, filterStatus, filterQuarter, filterHasPenalty]);

  const summary = useMemo(() => {
    const filters: Partial<
      Record<keyof import('@/types/lodgement').LodgementFilters, string | number | boolean>
    > = {};
    if (filterType) filters.type = filterType;
    if (filterYear) filters.year = filterYear;
    if (filterStatus) filters.status = filterStatus;
    if (filterQuarter) filters.quarter = filterQuarter;
    if (filterHasPenalty !== '') filters.hasPenalty = filterHasPenalty;

    return getSummary(
      Object.keys(filters).length > 0
        ? (filters as import('@/types/lodgement').LodgementFilters)
        : undefined,
    );
  }, [getSummary, filterType, filterYear, filterStatus, filterQuarter, filterHasPenalty]);

  const riskAssessment = useMemo(() => {
    return assessInvestigationRisk(records, atoData?.penalties);
  }, [records, atoData]);

  // Auto-populate due date when type, quarter, or year changes (only for new records, not when editing)
  useEffect(() => {
    if (!editingId) {
      const dueDate = calculateDueDate(formType, formQuarter, formYear);
      setFormDueDate(dueDate);
    }
  }, [formType, formQuarter, formYear, editingId]);

  const calculateDueDate = (
    type: 'gst-bas' | 'company-tax' | 'income-tax',
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    year: number,
  ): string => {
    if (type === 'gst-bas') {
      switch (quarter) {
        case 'Q1': // Jul-Sep
          return `${year}-10-28`;
        case 'Q2': // Oct-Dec
          return `${year + 1}-02-28`;
        case 'Q3': // Jan-Mar
          return `${year + 1}-04-28`;
        case 'Q4': // Apr-Jun
          return `${year + 1}-07-28`;
      }
    } else if (type === 'company-tax') {
      // Company tax: Due Oct 31 following year
      return `${year + 1}-10-31`;
    } else {
      // Income tax: Due Oct 31 following year
      return `${year + 1}-10-31`;
    }
  };

  const resetForm = () => {
    setFormType('gst-bas');
    setFormQuarter('Q1');
    setFormYear(new Date().getFullYear());
    setFormStatus('lodged');
    setFormDueDate('');
    setFormLodgementDate('');
    setFormAmount('');
    setFormNotes('');
    setFormHasPenalty(false);
    setFormPenaltyAmount('');
    setEditingId(null);
    setShowForm(false);
  };

  const loadEditForm = (record: LodgementRecord) => {
    setEditingId(record.id);
    setFormType(record.type);
    if (record.quarter) {
      setFormQuarter(record.quarter);
    }
    setFormYear(record.year);
    setFormStatus(record.status);
    setFormDueDate(record.dueDate.slice(0, 10));
    setFormLodgementDate(record.lodgementDate ? record.lodgementDate.slice(0, 10) : '');
    setFormAmount(record.amount.toString());
    setFormNotes(record.notes || '');
    setFormHasPenalty(record.hasPenalty || false);
    setFormPenaltyAmount(record.penaltyAmount ? record.penaltyAmount.toString() : '');
    setShowForm(true);

    // Scroll to form after it renders
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSubmit = () => {
    try {
      const amount = parseFloat(formAmount) || 0;
      const penaltyAmount = formHasPenalty ? parseFloat(formPenaltyAmount) || 0 : undefined;

      if (!formDueDate) {
        toast.error('Due date is required');
        return;
      }

      if (formStatus === 'lodged' && !formLodgementDate) {
        toast.error('Lodgement date is required when status is lodged');
        return;
      }

      if (formHasPenalty && !formPenaltyAmount) {
        toast.error('Penalty amount is required when penalty is applied');
        return;
      }

      const recordData = {
        type: formType,
        quarter: formType === 'gst-bas' ? formQuarter : undefined,
        year: formYear,
        status: formStatus,
        dueDate: new Date(formDueDate).toISOString(),
        lodgementDate: formLodgementDate ? new Date(formLodgementDate).toISOString() : undefined,
        amount,
        notes: formNotes,
        hasPenalty: formHasPenalty || undefined,
        penaltyAmount,
        source: 'manual' as const,
      };

      if (editingId) {
        updateLodgement(editingId, recordData);
        toast.success('Lodgement updated successfully');
      } else {
        addLodgement(recordData);
        toast.success('Lodgement added successfully');
      }

      resetForm();
    } catch (error) {
      toast.error((error as Error).message || 'Failed to save lodgement');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this lodgement record?')) {
      try {
        removeLodgement(id);
        toast.success('Lodgement deleted successfully');
      } catch {
        toast.error('Failed to delete lodgement');
      }
    }
  };

  const handleExportCsv = () => {
    if (records.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = [
      'ID',
      'Type',
      'Year',
      'Quarter',
      'Status',
      'Due Date',
      'Lodgement Date',
      'Amount',
      'Late',
      'Days Late',
      'Has Penalty',
      'Penalty Amount',
      'Notes',
      'Source',
    ];

    const rows = records.map((r) => [
      r.id,
      r.type,
      r.year.toString(),
      r.quarter || '',
      r.status,
      r.dueDate,
      r.lodgementDate || '',
      r.amount.toFixed(2),
      r.isLate ? 'Yes' : 'No',
      r.daysLate?.toString() || '0',
      r.hasPenalty ? 'Yes' : 'No',
      r.penaltyAmount?.toFixed(2) || '0.00',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      r.source || 'manual',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gstcalc-lodgements-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${records.length} records exported as CSV`);
  };

  const handleBulkImport = () => {
    if (
      !confirm(
        `This will import ${BAS_HISTORY_IMPORT.length} BAS records from 2020-2024. Continue?`,
      )
    ) {
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    BAS_HISTORY_IMPORT.forEach((record) => {
      try {
        // Convert date strings to ISO format
        const recordWithIso = {
          ...record,
          dueDate: new Date(record.dueDate + 'T00:00:00').toISOString(),
          lodgementDate: new Date(record.lodgementDate + 'T00:00:00').toISOString(),
          source: 'manual' as const,
        };

        addLodgement(recordWithIso);
        successCount++;
      } catch (error) {
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('already exists')) {
          skipCount++;
        } else {
          errorCount++;
          console.error('Import error:', error);
        }
      }
    });

    if (successCount > 0) {
      toast.success(`Imported ${successCount} records successfully`);
    }
    if (skipCount > 0) {
      toast.info(`Skipped ${skipCount} duplicate records`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} records`);
    }
  };

  const handleIncomeTaxImport = () => {
    if (
      !confirm(
        `This will import ${INCOME_TAX_IMPORT.length} Income Tax returns from 2020-2022. Continue?`,
      )
    ) {
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    INCOME_TAX_IMPORT.forEach((record) => {
      try {
        // Convert date strings to ISO format
        const recordWithIso = {
          ...record,
          dueDate: new Date(record.dueDate + 'T00:00:00').toISOString(),
          lodgementDate: new Date(record.lodgementDate + 'T00:00:00').toISOString(),
          source: 'manual' as const,
        };

        addLodgement(recordWithIso);
        successCount++;
      } catch (error) {
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('already exists')) {
          skipCount++;
        } else {
          errorCount++;
          console.error('Import error:', error);
        }
      }
    });

    if (successCount > 0) {
      toast.success(`Imported ${successCount} income tax records successfully`);
    }
    if (skipCount > 0) {
      toast.info(`Skipped ${skipCount} duplicate records`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} records`);
    }
  };

  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    // 10 years back + current year + 2 years forward = 13 total years
    return Array.from({ length: 13 }, (_, i) => currentYear - 10 + i);
  };

  return (
    <div className="grid gap-6">
      {/* Header with Add Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <FileTextIcon className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-2xl">Lodgement History</CardTitle>
                <CardDescription>
                  Track all BAS, company tax, and income tax lodgements with ATO investigation risk
                  analysis
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              {records.length === 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleBulkImport}>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Import BAS History
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleIncomeTaxImport}>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Import Income Tax
                  </Button>
                </>
              )}
              <Button size="sm" onClick={() => setShowForm(!showForm)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Lodgement
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        {showFilters && (
          <CardContent className="border-t border-slate-200 bg-slate-50 pt-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value as 'gst-bas' | 'company-tax' | 'income-tax' | '')
                  }
                >
                  <option value="">All types</option>
                  <option value="gst-bas">GST BAS</option>
                  <option value="company-tax">Company Tax</option>
                  <option value="income-tax">Income Tax</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : '')}
                >
                  <option value="">All years</option>
                  {getYearRange().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'lodged' | 'not-lodged' | '')}
                >
                  <option value="">All statuses</option>
                  <option value="lodged">Lodged</option>
                  <option value="not-lodged">Not Lodged</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Penalty</Label>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={filterHasPenalty === '' ? '' : filterHasPenalty ? 'true' : 'false'}
                  onChange={(e) =>
                    setFilterHasPenalty(e.target.value === '' ? '' : e.target.value === 'true')
                  }
                >
                  <option value="">All records</option>
                  <option value="true">With Penalty</option>
                  <option value="false">No Penalty</option>
                </select>
              </div>

              {filterType === 'gst-bas' && (
                <div className="space-y-2">
                  <Label>Quarter</Label>
                  <select
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={filterQuarter}
                    onChange={(e) =>
                      setFilterQuarter(e.target.value as 'Q1' | 'Q2' | 'Q3' | 'Q4' | '')
                    }
                  >
                    <option value="">All quarters</option>
                    {QUARTERS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterType('');
                  setFilterYear('');
                  setFilterStatus('');
                  setFilterQuarter('');
                  setFilterHasPenalty('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        )}

        {/* Entry Form */}
        {showForm && (
          <CardContent
            ref={formRef}
            className="space-y-4 border-t border-slate-200 bg-slate-50 pt-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {editingId ? 'Edit Lodgement' : 'Add New Lodgement'}
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={formType}
                  onChange={(e) =>
                    setFormType(e.target.value as 'gst-bas' | 'company-tax' | 'income-tax')
                  }
                >
                  <option value="gst-bas">GST BAS</option>
                  <option value="company-tax">Company Tax</option>
                  <option value="income-tax">Income Tax</option>
                </select>
              </div>

              {formType === 'gst-bas' && (
                <div className="space-y-2">
                  <Label>Quarter</Label>
                  <select
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={formQuarter}
                    onChange={(e) => setFormQuarter(e.target.value as 'Q1' | 'Q2' | 'Q3' | 'Q4')}
                  >
                    {QUARTERS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Year</Label>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={formYear}
                  onChange={(e) => setFormYear(parseInt(e.target.value))}
                >
                  {getYearRange().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'lodged' | 'not-lodged')}
                >
                  <option value="lodged">Lodged</option>
                  <option value="not-lodged">Not Lodged</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                />
              </div>

              {formStatus === 'lodged' && (
                <div className="space-y-2">
                  <Label>Lodgement Date</Label>
                  <Input
                    type="date"
                    value={formLodgementDate}
                    onChange={(e) => setFormLodgementDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Add any notes about this lodgement..."
              />
            </div>

            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasPenalty"
                  checked={formHasPenalty}
                  onChange={(e) => setFormHasPenalty(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700"
                />
                <Label htmlFor="hasPenalty" className="cursor-pointer font-medium">
                  ATO Penalty Applied
                </Label>
              </div>

              {formHasPenalty && (
                <div className="space-y-2">
                  <Label>Penalty Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formPenaltyAmount}
                    onChange={(e) => setFormPenaltyAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Add'} Lodgement</Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Risk Analysis Panel */}
      {records.length > 0 && <InvestigationRiskPanel riskAssessment={riskAssessment} />}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.totalRecords}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Records</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.lodgedCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Lodged</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.notLodgedCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Not Lodged</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(
                filteredRecords.filter((r) => r.amount > 0).reduce((sum, r) => sum + r.amount, 0),
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Debt</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(
                Math.abs(
                  filteredRecords.filter((r) => r.amount < 0).reduce((sum, r) => sum + r.amount, 0),
                ),
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Refund</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(summary.totalPenalties)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Penalties ({summary.penaltyCount})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Net Position Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Net Position</p>
              <p
                className={`text-3xl font-bold ${
                  summary.totalAmount > 0
                    ? 'text-red-600 dark:text-red-400'
                    : summary.totalAmount < 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {formatCurrency(Math.abs(summary.totalAmount))}{' '}
                {summary.totalAmount > 0
                  ? 'owed'
                  : summary.totalAmount < 0
                    ? 'refunded'
                    : 'balanced'}
              </p>
            </div>
            <div className="text-right text-sm text-slate-600 dark:text-slate-400">
              <p>
                Debts:{' '}
                {formatCurrency(
                  filteredRecords.filter((r) => r.amount > 0).reduce((sum, r) => sum + r.amount, 0),
                )}
              </p>
              <p>
                Refunds:{' '}
                {formatCurrency(
                  Math.abs(
                    filteredRecords
                      .filter((r) => r.amount < 0)
                      .reduce((sum, r) => sum + r.amount, 0),
                  ),
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle>All Lodgements ({filteredRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <FileTextIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No lodgement records found</p>
              <p className="text-sm">
                {showFilters
                  ? 'Try adjusting your filters'
                  : 'Click "Add Lodgement" to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={record.type === 'gst-bas' ? 'default' : 'outline'}>
                        {record.type === 'gst-bas'
                          ? 'BAS'
                          : record.type === 'company-tax'
                            ? 'Company Tax'
                            : 'Income Tax'}
                      </Badge>
                      {record.type === 'gst-bas' && record.quarter && (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {record.quarter} {record.year}
                        </span>
                      )}
                      {(record.type === 'company-tax' || record.type === 'income-tax') && (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {record.year}
                        </span>
                      )}
                      {record.status === 'lodged' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      {record.isLate && record.daysLate && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">
                            Late ({record.daysLate} days)
                          </span>
                        </div>
                      )}
                      {record.hasPenalty && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                            Penalty
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <span
                        className={
                          record.amount < 0
                            ? 'font-semibold text-green-600 dark:text-green-400'
                            : 'font-semibold text-red-600 dark:text-red-400'
                        }
                      >
                        Amount: {formatCurrency(Math.abs(record.amount))}{' '}
                        {record.amount < 0 ? '(Refund)' : '(Debt)'}
                      </span>
                      {record.hasPenalty && record.penaltyAmount && (
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          Penalty: {formatCurrency(record.penaltyAmount)}
                        </span>
                      )}
                      <span>Due: {new Date(record.dueDate).toLocaleDateString('en-AU')}</span>
                      {record.lodgementDate && (
                        <span>
                          Lodged: {new Date(record.lodgementDate).toLocaleDateString('en-AU')}
                        </span>
                      )}
                    </div>
                    {record.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{record.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadEditForm(record)}
                      title="Edit this lodgement"
                      aria-label="Edit lodgement"
                      className="gap-1"
                    >
                      <Pencil className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      title="Delete this lodgement"
                      aria-label="Delete lodgement"
                      className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
