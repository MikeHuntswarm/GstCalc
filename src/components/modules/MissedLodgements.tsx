import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { CalendarCheckIcon, ClipboardListIcon, AlertTriangleIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { estimateFailureToLodgePenalty } from '@/lib/calculations/penalties';
import { useAtoStore } from '@/store/ato';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
type Quarter = (typeof QUARTERS)[number];

type MissedType = 'gst-bas' | 'company-tax';

type MissedPeriod = {
  id: number;
  type: MissedType;
  quarter: Quarter | '';
  year: string;
  label: string;
  amount: string;
  dueDate: string;
  notes: string;
};

const STORAGE_KEY = 'gstcalc_missed_lodgements_v2';

function computeDefaultDueDate(type: MissedType, quarter: Quarter | '', year: string): string | null {
  const numericYear = Number.parseInt(year, 10);
  if (!numericYear || Number.isNaN(numericYear)) {
    return null;
  }

  if (type === 'gst-bas') {
    switch (quarter) {
      case 'Q1':
        // July–September quarter, due 28 October of the same income year
        return `${numericYear}-10-28`;
      case 'Q2':
        // October–December quarter, due 28 February of the following calendar year
        return `${numericYear + 1}-02-28`;
      case 'Q3':
        // January–March quarter, due 28 April of the following calendar year
        return `${numericYear + 1}-04-28`;
      case 'Q4':
        // April–June quarter, due 28 July of the following calendar year
        return `${numericYear + 1}-07-28`;
      default:
        return null;
    }
  }

  // Approximate annual company tax due date for planning purposes only
  return `${numericYear + 1}-05-15`;
}

const createEmptyRow = (id: number): MissedPeriod => ({
  id,
  type: 'gst-bas',
  quarter: 'Q1',
  year: new Date().getFullYear().toString(),
  label: '',
  amount: '',
  dueDate: '',
  notes: '',
});

function normaliseDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function MissedLodgements() {
  const {
    data: atoData,
  } = useAtoStore();
  const penalties = atoData?.penalties;

  const [rows, setRows] = useState<MissedPeriod[]>([createEmptyRow(1)]);

  // Load saved rows from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<MissedPeriod>[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setRows(
          parsed.map((row, index) => ({
            ...createEmptyRow(index + 1),
            ...row,
          })),
        );
      }
    } catch {
      // Ignore corrupt storage and fall back to defaults
    }
  }, []);

  // Persist rows whenever they change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // Ignore storage errors (e.g. private mode)
    }
  }, [rows]);

  // Auto-populate due dates for known BAS quarters and annual company tax years.
  // Runs whenever rows change and keeps the due date in sync with the selected type/quarter/year,
  // while avoiding infinite loops when the suggested value hasn't changed.
  useEffect(() => {
    setRows((current) => {
      let changed = false;

      const next = current.map((row) => {
        const suggestion = computeDefaultDueDate(row.type, row.quarter, row.year);
        if (!suggestion || row.dueDate === suggestion) {
          return row;
        }

        changed = true;
        return {
          ...row,
          dueDate: suggestion,
        };
      });

      return changed ? next : current;
    });
  }, [rows]);

  const handleRowChange = <T extends HTMLInputElement | HTMLSelectElement>(
    id: number,
    field: keyof MissedPeriod,
    event: ChangeEvent<T>,
  ) => {
    const value = event.target.value;
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: field === 'quarter' ? (value as Quarter | '') : value,
            }
          : row,
      ),
    );
  };

  const handleAmountChange = (id: number, event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              amount: raw.replace(/[^0-9.-]/g, ''),
            }
          : row,
      ),
    );
  };

  const handleAddRow = () => {
    setRows((current) => {
      const nextId = current.length === 0 ? 1 : Math.max(...current.map((r) => r.id)) + 1;
      return [...current, createEmptyRow(nextId)];
    });
  };

  const handleRemoveRow = (id: number) => {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)));
  };

  const parsed = useMemo(() => {
    const today = normaliseDateOnly(new Date().toISOString().slice(0, 10));

    return rows.map((row) => {
      const numericAmount = Number.parseFloat(row.amount || '0') || 0;

      const due = normaliseDateOnly(row.dueDate || null);
      let numericDaysLate = 0;
      if (due && today) {
        const diffMs = today.getTime() - due.getTime();
        if (diffMs > 0) {
          numericDaysLate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        }
      }

      const penaltyEstimate =
        penalties && numericDaysLate > 0
          ? estimateFailureToLodgePenalty(numericDaysLate, penalties.failureToLodge)
          : { penaltyUnits: 0, amount: 0, periodsLate: 0 };

      return {
        ...row,
        numericAmount,
        numericDaysLate,
        penaltyEstimate,
      };
    });
  }, [rows, penalties]);

  const totals = useMemo(() => {
    return parsed.reduce(
      (acc, row) => {
        if (row.type === 'gst-bas') {
          acc.gst += Math.max(0, row.numericAmount);
        } else {
          acc.company += Math.max(0, row.numericAmount);
        }
        acc.penalties += Math.max(0, row.penaltyEstimate.amount);
        return acc;
      },
      { gst: 0, company: 0, penalties: 0 },
    );
  }, [parsed]);

  const grandTotal = totals.gst + totals.company;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <CalendarCheckIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">Catch-up planner</CardTitle>
              <CardDescription>
                Record missed BAS quarters and annual company tax to see your outstanding totals and
                late penalties in one place.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-violet-200 bg-violet-50 text-violet-900">
            This page is for planning and cash flow only. It does not lodge forms with the ATO and
            penalty estimates are indicative only. Days late are worked out automatically from the
            due date compared to today.
          </Alert>

          <div className="space-y-3">
            {parsed.map((row) => (
              <div
                key={row.id}
                className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={row.type === 'gst-bas' ? 'default' : 'outline'}>
                      {row.type === 'gst-bas' ? 'GST BAS' : 'Annual company tax'}
                    </Badge>
                    {(row.year || row.quarter) && (
                      <span className="text-xs text-slate-500">
                        {row.year && `Tax year ${row.year}`}
                        {row.type === 'gst-bas' && row.quarter
                          ? row.year
                            ? ` · ${row.quarter}`
                            : row.quarter
                          : ''}
                      </span>
                    )}
                  </div>
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRow(row.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <select
                      className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      value={row.type}
                      onChange={(event) =>
                        handleRowChange(row.id, 'type', event as ChangeEvent<HTMLSelectElement>)
                      }
                    >
                      <option value="gst-bas">GST BAS</option>
                      <option value="company-tax">Annual company tax</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label>Quarter (for BAS)</Label>
                    <select
                      className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={row.quarter}
                      disabled={row.type !== 'gst-bas'}
                      onChange={(event) =>
                        handleRowChange(row.id, 'quarter', event as ChangeEvent<HTMLSelectElement>)
                      }
                    >
                      {QUARTERS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label>Tax year</Label>
                    <Input
                      inputMode="numeric"
                      value={row.year}
                      placeholder="e.g. 2024"
                      onChange={(event) => handleRowChange(row.id, 'year', event)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Amount missed</Label>
                    <Input
                      inputMode="decimal"
                      value={row.amount}
                      placeholder="e.g. 3500"
                      onChange={(event) => handleAmountChange(row.id, event)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Due date</Label>
                    <Input
                      type="date"
                      value={row.dueDate}
                      onChange={(event) => handleRowChange(row.id, 'dueDate', event)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={row.notes}
                    placeholder="e.g. BAS July–September 2024, not yet lodged"
                    onChange={(event) => handleRowChange(row.id, 'notes', event)}
                  />
                </div>

                {row.numericDaysLate > 0 && penalties ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>
                        Days late (as at today): {row.numericDaysLate} · 28-day periods:{' '}
                        {row.penaltyEstimate.periodsLate}
                      </span>
                      <span className="font-semibold">
                        Estimated Failure to Lodge penalty: {formatCurrency(row.penaltyEstimate.amount)} (
                        {row.penaltyEstimate.penaltyUnits} units)
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
              Add another missed period
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <ClipboardListIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">Outstanding summary</CardTitle>
              <CardDescription>Totals based on the amounts and due dates you’ve entered.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <div className="flex items-center justify-between">
              <span>GST / BAS catch-up</span>
              <span className="font-semibold">{formatCurrency(totals.gst)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Annual company tax catch-up</span>
              <span className="font-semibold">{formatCurrency(totals.company)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Estimated Failure to Lodge penalties</span>
              <span className="font-semibold">{formatCurrency(totals.penalties)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold">
              <span>Total outstanding (all periods, before GIC)</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <Alert variant={grandTotal > 0 ? 'warning' : 'default'}>
            <div className="flex items-start gap-2">
              <AlertTriangleIcon className="mt-0.5 h-4 w-4" />
              <div className="space-y-1 text-xs text-slate-700">
                <p>
                  Penalty amounts shown here are estimates based on the current Failure to Lodge
                  settings only. They do not include General Interest Charge (GIC) or any payment
                  arrangements.
                </p>
                <p>
                  Use this as a planning tool, then confirm actual amounts with your tax agent or the
                  ATO before paying.
                </p>
              </div>
            </div>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
