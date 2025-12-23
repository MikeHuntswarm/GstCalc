import { useState, useMemo } from 'react';
import {
  FileTextIcon,
  PlusIcon,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Filter,
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

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

export function LodgementHistory() {
  const { records, addLodgement, updateLodgement, removeLodgement, getSummary } =
    useLodgementHistoryStore();
  const { data: atoData } = useAtoStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<'gst-bas' | 'company-tax'>('gst-bas');
  const [formQuarter, setFormQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formStatus, setFormStatus] = useState<'lodged' | 'not-lodged'>('lodged');
  const [formDueDate, setFormDueDate] = useState('');
  const [formLodgementDate, setFormLodgementDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'gst-bas' | 'company-tax' | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<'lodged' | 'not-lodged' | ''>('');
  const [filterQuarter, setFilterQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | ''>('');

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

    return filtered.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [records, filterType, filterYear, filterStatus, filterQuarter]);

  const summary = useMemo(() => {
    const filters: Partial<
      Record<keyof import('@/types/lodgement').LodgementFilters, string | number>
    > = {};
    if (filterType) filters.type = filterType;
    if (filterYear) filters.year = filterYear;
    if (filterStatus) filters.status = filterStatus;
    if (filterQuarter) filters.quarter = filterQuarter;

    return getSummary(
      Object.keys(filters).length > 0
        ? (filters as import('@/types/lodgement').LodgementFilters)
        : undefined,
    );
  }, [getSummary, filterType, filterYear, filterStatus, filterQuarter]);

  const riskAssessment = useMemo(() => {
    return assessInvestigationRisk(records, atoData?.penalties);
  }, [records, atoData]);

  const resetForm = () => {
    setFormType('gst-bas');
    setFormQuarter('Q1');
    setFormYear(new Date().getFullYear());
    setFormStatus('lodged');
    setFormDueDate('');
    setFormLodgementDate('');
    setFormAmount('');
    setFormNotes('');
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
    setShowForm(true);
  };

  const handleSubmit = () => {
    try {
      const amount = parseFloat(formAmount) || 0;

      if (!formDueDate) {
        toast.error('Due date is required');
        return;
      }

      if (formStatus === 'lodged' && !formLodgementDate) {
        toast.error('Lodgement date is required when status is lodged');
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

  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
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
                  Track all BAS and company tax lodgements with ATO investigation risk analysis
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
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
                  onChange={(e) => setFilterType(e.target.value as 'gst-bas' | 'company-tax' | '')}
                >
                  <option value="">All types</option>
                  <option value="gst-bas">GST BAS</option>
                  <option value="company-tax">Company Tax</option>
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
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        )}

        {/* Entry Form */}
        {showForm && (
          <CardContent className="space-y-4 border-t border-slate-200 bg-slate-50 pt-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {editingId ? 'Edit Lodgement' : 'Add New Lodgement'}
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as 'gst-bas' | 'company-tax')}
                >
                  <option value="gst-bas">GST BAS</option>
                  <option value="company-tax">Company Tax</option>
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

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-4">
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
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(summary.totalAmount)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Amount</p>
          </CardContent>
        </Card>
      </div>

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
                        {record.type === 'gst-bas' ? 'BAS' : 'Company Tax'}
                      </Badge>
                      {record.type === 'gst-bas' && record.quarter && (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {record.quarter} {record.year}
                        </span>
                      )}
                      {record.type === 'company-tax' && (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {record.year}
                        </span>
                      )}
                      {record.status === 'lodged' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <span>Amount: {formatCurrency(record.amount)}</span>
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
                    <Button variant="ghost" size="sm" onClick={() => loadEditForm(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                      <Trash2 className="h-4 w-4" />
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
