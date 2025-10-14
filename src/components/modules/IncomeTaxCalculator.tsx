import { useMemo, useState } from 'react';
import { CalculatorIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { calculateIncomeTax } from '@/lib/calculations/incomeTax';
import type { FinancialYearRates } from '@/types/ato';

interface IncomeTaxCalculatorProps {
  years: FinancialYearRates[];
  lastUpdated: string;
}

type Frequency = 'annual' | 'weekly';

const QUICK_AMOUNTS = [60000, 85000, 120000];

export function IncomeTaxCalculator({ years, lastUpdated }: IncomeTaxCalculatorProps) {
  const [selectedYear, setSelectedYear] = useState(years[0]?.year ?? '');
  const [frequency, setFrequency] = useState<Frequency>('annual');
  const [incomeInput, setIncomeInput] = useState('');

  const yearData = useMemo(
    () => years.find((year) => year.year === selectedYear) ?? years[0],
    [selectedYear, years],
  );

  const parsedIncome = useMemo(() => {
    const value = parseFloat(incomeInput.replace(/[^0-9.-]/g, ''));
    const safeValue = Number.isFinite(value) ? value : 0;
    return frequency === 'annual' ? safeValue : safeValue * 52;
  }, [frequency, incomeInput]);

  const breakdown = useMemo(() => {
    if (!yearData) {
      return null;
    }
    return calculateIncomeTax(parsedIncome, yearData);
  }, [parsedIncome, yearData]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <CalculatorIcon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-2xl">PAYG Income Tax</CardTitle>
            <CardDescription>
              Estimate your Australian individual income tax for different financial years and pay
              frequencies.
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>Financial year</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {years.map((year) => (
                <option key={year.year} value={year.year}>
                  {year.year}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline">
            Rates updated {new Date(lastUpdated).toLocaleDateString('en-AU')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="income">
              Taxable income ({frequency === 'annual' ? 'annual' : 'weekly'})
            </Label>
            <Input
              id="income"
              inputMode="decimal"
              value={incomeInput}
              onChange={(event) => setIncomeInput(event.target.value)}
              placeholder={frequency === 'annual' ? 'e.g. 85000' : 'e.g. 1600'}
            />
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFrequency('annual');
                    setIncomeInput(amount.toString());
                  }}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => setIncomeInput('')}>
                Clear
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Income frequency</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={frequency === 'annual' ? 'default' : 'outline'}
                onClick={() => setFrequency('annual')}
              >
                Annual
              </Button>
              <Button
                type="button"
                variant={frequency === 'weekly' ? 'default' : 'outline'}
                onClick={() => setFrequency('weekly')}
              >
                Weekly
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Weekly income is multiplied by 52 to annualise for tax bracket calculations.
            </p>
          </div>
        </div>

        {yearData && breakdown ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div>
                <p className="text-xs uppercase text-slate-500">Estimated annual tax</p>
                <p className="text-3xl font-semibold text-slate-900">
                  {formatCurrency(breakdown.annualTax)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-slate-500">Net annual income</p>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(breakdown.netAnnualIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Net weekly income</p>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(breakdown.weeklyNetIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Weekly PAYG withholding</p>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(breakdown.weeklyTax)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Average tax rate</p>
                  <p className="font-semibold text-slate-900">
                    {formatPercent(breakdown.averageRate)}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-inner">
              <h4 className="text-lg font-semibold text-slate-900">How your tax is calculated</h4>
              <p className="text-sm text-slate-600">
                Your income sits in the <strong>{formatPercent(breakdown.marginalRate)}</strong>{' '}
                marginal tax bracket. The calculation starts with base tax of{' '}
                {formatCurrency(breakdown.bracket.baseTax)} once your income exceeds
                {formatCurrency(breakdown.bracket.threshold)}, then applies the marginal rate to the
                remaining amount.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                {yearData.taxBrackets.map((bracket, index) => {
                  const nextThreshold = yearData.taxBrackets[index + 1]?.threshold;
                  const rangeLabel = nextThreshold
                    ? `${formatCurrency(bracket.threshold)} – ${formatCurrency(nextThreshold - 1)}`
                    : `${formatCurrency(bracket.threshold)} and above`;
                  const isActive = breakdown.bracket.threshold === bracket.threshold;
                  return (
                    <li
                      key={`${yearData.year}-${bracket.threshold}`}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                        isActive
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          : 'border-transparent bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {rangeLabel}
                      </span>
                      <span className="text-sm font-medium">{formatPercent(bracket.rate)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : (
          <Alert variant="destructive">
            Unable to load tax brackets for the selected financial year.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
