import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { LodgementFilters as Filters } from '@/types/lodgement';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

interface LodgementFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

const selectClass =
  'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

export function LodgementFilters({ filters, onChange, onClear }: LodgementFiltersProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <select
            className={selectClass}
            value={filters.type ?? ''}
            onChange={(e) => set({ type: (e.target.value || undefined) as Filters['type'] })}
          >
            <option value="">All types</option>
            <option value="gst-bas">GST BAS</option>
            <option value="company-tax">Company Tax</option>
            <option value="income-tax">Income Tax</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <select
            className={selectClass}
            value={filters.status ?? ''}
            onChange={(e) => set({ status: (e.target.value || undefined) as Filters['status'] })}
          >
            <option value="">All statuses</option>
            <option value="lodged">Lodged</option>
            <option value="not-lodged">Not Lodged</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Penalty</Label>
          <select
            className={selectClass}
            value={filters.hasPenalty === undefined ? '' : filters.hasPenalty ? 'true' : 'false'}
            onChange={(e) =>
              set({ hasPenalty: e.target.value === '' ? undefined : e.target.value === 'true' })
            }
          >
            <option value="">All records</option>
            <option value="true">With Penalty</option>
            <option value="false">No Penalty</option>
          </select>
        </div>

        {filters.type === 'gst-bas' ? (
          <div className="space-y-2">
            <Label>Quarter</Label>
            <select
              className={selectClass}
              value={filters.quarter ?? ''}
              onChange={(e) =>
                set({ quarter: (e.target.value || undefined) as Filters['quarter'] })
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
        ) : (
          <div className="space-y-2">
            <Label>Year</Label>
            <select
              className={selectClass}
              value={filters.year ?? ''}
              onChange={(e) => set({ year: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">All years</option>
              {Array.from({ length: 13 }, (_, i) => new Date().getFullYear() - 10 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
