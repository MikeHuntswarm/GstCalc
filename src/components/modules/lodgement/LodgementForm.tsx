import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

export interface LodgementFormState {
  type: 'gst-bas' | 'company-tax' | 'income-tax';
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  status: 'lodged' | 'not-lodged';
  dueDate: string;
  lodgementDate: string;
  amount: string;
  notes: string;
  hasPenalty: boolean;
  penaltyAmount: string;
}

interface LodgementFormProps {
  state: LodgementFormState;
  editingId: string | null;
  yearRange: number[];
  onChange: (patch: Partial<LodgementFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const selectClass =
  'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

export function LodgementForm({
  state,
  editingId,
  yearRange,
  onChange,
  onSubmit,
  onCancel,
}: LodgementFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
        {editingId ? 'Edit Lodgement' : 'Add New Lodgement'}
      </h3>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <select
            className={selectClass}
            value={state.type}
            onChange={(e) => onChange({ type: e.target.value as LodgementFormState['type'] })}
          >
            <option value="gst-bas">GST BAS</option>
            <option value="company-tax">Company Tax</option>
            <option value="income-tax">Income Tax</option>
          </select>
        </div>

        {state.type === 'gst-bas' && (
          <div className="space-y-2">
            <Label>Quarter</Label>
            <select
              className={selectClass}
              value={state.quarter}
              onChange={(e) => onChange({ quarter: e.target.value as 'Q1' | 'Q2' | 'Q3' | 'Q4' })}
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
            className={selectClass}
            value={state.year}
            onChange={(e) => onChange({ year: parseInt(e.target.value) })}
          >
            {yearRange.map((year) => (
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
            className={selectClass}
            value={state.status}
            onChange={(e) => onChange({ status: e.target.value as 'lodged' | 'not-lodged' })}
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
            value={state.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input
            type="date"
            value={state.dueDate}
            onChange={(e) => onChange({ dueDate: e.target.value })}
          />
        </div>

        {state.status === 'lodged' && (
          <div className="space-y-2">
            <Label>Lodgement Date</Label>
            <Input
              type="date"
              value={state.lodgementDate}
              onChange={(e) => onChange({ lodgementDate: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Input
          value={state.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Add any notes about this lodgement..."
        />
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="hasPenalty"
            checked={state.hasPenalty}
            onChange={(e) => onChange({ hasPenalty: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700"
          />
          <Label htmlFor="hasPenalty" className="cursor-pointer font-medium">
            ATO Penalty Applied
          </Label>
        </div>

        {state.hasPenalty && (
          <div className="space-y-2">
            <Label>Penalty Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={state.penaltyAmount}
              onChange={(e) => onChange({ penaltyAmount: e.target.value })}
              placeholder="0.00"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>{editingId ? 'Update' : 'Add'} Lodgement</Button>
      </div>
    </div>
  );
}
