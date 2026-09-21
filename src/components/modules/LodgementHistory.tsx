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
import { Badge } from '@/components/ui/badge';
import { useLodgementHistoryStore } from '@/store/lodgementHistory';
import { useAtoStore } from '@/store/ato';
import { assessInvestigationRisk } from '@/lib/calculations/atoInvestigationRisk';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { LodgementRecord, LodgementFilters } from '@/types/lodgement';
import { InvestigationRiskPanel } from './InvestigationRiskPanel';
import { BAS_HISTORY_IMPORT, INCOME_TAX_IMPORT } from '@/data/bas-history-import';
import { dueDateFor } from '@/lib/calculations/dueDates';
import { downloadCsv } from '@/lib/lodgementExport';
import { importRecords } from '@/lib/lodgementImport';
import { LodgementForm, type LodgementFormState } from './lodgement/LodgementForm';
import { LodgementFilters as FiltersPanel } from './lodgement/LodgementFilters';

const EMPTY_FORM: LodgementFormState = {
  type: 'gst-bas',
  quarter: 'Q1',
  year: new Date().getFullYear(),
  status: 'lodged',
  dueDate: '',
  lodgementDate: '',
  amount: '',
  notes: '',
  hasPenalty: false,
  penaltyAmount: '',
};

export function LodgementHistory() {
  const {
    records,
    addLodgement,
    updateLodgement,
    removeLodgement,
    getSummary,
    getFilteredLodgements,
  } = useLodgementHistoryStore();
  const { data: atoData } = useAtoStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Auto-import income tax records on mount if they don't exist
  useEffect(() => {
    const hasIncomeTax = records.some((r) => r.type === 'income-tax');
    if (!hasIncomeTax && INCOME_TAX_IMPORT.length > 0) {
      importRecords(INCOME_TAX_IMPORT, addLodgement);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Form state
  const [form, setForm] = useState<LodgementFormState>(EMPTY_FORM);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LodgementFilters>({});

  const filteredRecords = useMemo(
    () => getFilteredLodgements(filters),
    [getFilteredLodgements, filters],
  );

  const summary = useMemo(
    () => getSummary(Object.keys(filters).length > 0 ? filters : undefined),
    [getSummary, filters],
  );

  const riskAssessment = useMemo(
    () => assessInvestigationRisk(records, atoData?.penalties),
    [records, atoData],
  );

  // Auto-populate due date when type, quarter, or year changes (only for new records)
  useEffect(() => {
    if (!editingId) {
      setForm((f) => ({ ...f, dueDate: dueDateFor(form.type, form.quarter, form.year) }));
    }
  }, [form.type, form.quarter, form.year, editingId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const loadEditForm = (record: LodgementRecord) => {
    setEditingId(record.id);
    setForm({
      type: record.type,
      quarter: record.quarter ?? 'Q1',
      year: record.year,
      status: record.status,
      dueDate: record.dueDate.slice(0, 10),
      lodgementDate: record.lodgementDate ? record.lodgementDate.slice(0, 10) : '',
      amount: record.amount.toString(),
      notes: record.notes || '',
      hasPenalty: record.hasPenalty || false,
      penaltyAmount: record.penaltyAmount ? record.penaltyAmount.toString() : '',
    });
    setShowForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSubmit = () => {
    try {
      const amount = parseFloat(form.amount) || 0;
      const penaltyAmount = form.hasPenalty ? parseFloat(form.penaltyAmount) || 0 : undefined;

      if (!form.dueDate) {
        toast.error('Due date is required');
        return;
      }

      if (form.status === 'lodged' && !form.lodgementDate) {
        toast.error('Lodgement date is required when status is lodged');
        return;
      }

      if (form.hasPenalty && !form.penaltyAmount) {
        toast.error('Penalty amount is required when penalty is applied');
        return;
      }

      const recordData = {
        type: form.type,
        quarter: form.type === 'gst-bas' ? form.quarter : undefined,
        year: form.year,
        status: form.status,
        dueDate: new Date(form.dueDate).toISOString(),
        lodgementDate: form.lodgementDate ? new Date(form.lodgementDate).toISOString() : undefined,
        amount,
        notes: form.notes,
        hasPenalty: form.hasPenalty || undefined,
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
    downloadCsv(records);
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
    const result = importRecords(BAS_HISTORY_IMPORT, addLodgement);
    if (result.success > 0) toast.success(`Imported ${result.success} records successfully`);
    if (result.skipped > 0) toast.info(`Skipped ${result.skipped} duplicate records`);
    if (result.errors > 0) toast.error(`Failed to import ${result.errors} records`);
  };

  const handleIncomeTaxImport = () => {
    if (
      !confirm(
        `This will import ${INCOME_TAX_IMPORT.length} Income Tax returns from 2020-2022. Continue?`,
      )
    ) {
      return;
    }
    const result = importRecords(INCOME_TAX_IMPORT, addLodgement);
    if (result.success > 0)
      toast.success(`Imported ${result.success} income tax records successfully`);
    if (result.skipped > 0) toast.info(`Skipped ${result.skipped} duplicate records`);
    if (result.errors > 0) toast.error(`Failed to import ${result.errors} records`);
  };

  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
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
            <FiltersPanel filters={filters} onChange={setFilters} onClear={() => setFilters({})} />
          </CardContent>
        )}

        {/* Entry Form */}
        {showForm && (
          <CardContent
            ref={formRef}
            className="space-y-4 border-t border-slate-200 bg-slate-50 pt-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <LodgementForm
              state={form}
              editingId={editingId}
              yearRange={getYearRange()}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
              onSubmit={handleSubmit}
              onCancel={resetForm}
            />
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
