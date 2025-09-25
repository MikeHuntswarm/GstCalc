
import { useMemo, useState } from 'react';
import { CalculatorIcon, TrendingUpIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { CompanyRate } from '@/types/ato';

const BASE_RATE_TURNOVER_CAP = 50_000_000;
const PASSIVE_INCOME_MAX_PERCENT = 80;

type AnnualBusinessTaxProps = {
  baseRate: CompanyRate;
  fullRate: CompanyRate;
};

function parseAmount(value: string) {
  return Number.parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
}

export function AnnualBusinessTax({ baseRate, fullRate }: AnnualBusinessTaxProps) {
  const [turnover, setTurnover] = useState('');
  const [taxableIncome, setTaxableIncome] = useState('');
  const [passiveIncomeRatio, setPassiveIncomeRatio] = useState('');

  const parsedTurnover = useMemo(() => Math.max(0, parseAmount(turnover)), [turnover]);
  const parsedTaxableIncome = useMemo(() => Math.max(0, parseAmount(taxableIncome)), [taxableIncome]);
  const parsedPassiveIncomeRatio = useMemo(() => {
    const numeric = Number.parseFloat(passiveIncomeRatio.replace(/[^0-9.]/g, '')) || 0;
    return Math.min(100, Math.max(0, numeric));
  }, [passiveIncomeRatio]);

  const qualifiesForBaseRate = useMemo(() => {
    return parsedTurnover <= BASE_RATE_TURNOVER_CAP && parsedPassiveIncomeRatio <= PASSIVE_INCOME_MAX_PERCENT;
  }, [parsedTurnover, parsedPassiveIncomeRatio]);

  const baseRateTax = useMemo(() => parsedTaxableIncome * baseRate.rate, [parsedTaxableIncome, baseRate.rate]);
  const fullRateTax = useMemo(() => parsedTaxableIncome * fullRate.rate, [parsedTaxableIncome, fullRate.rate]);
  const recommendedTax = qualifiesForBaseRate ? baseRateTax : fullRateTax;
  const recommendedRate = qualifiesForBaseRate ? baseRate.rate : fullRate.rate;
  const savingsCompared = fullRateTax - baseRateTax;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <CalculatorIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">Annual company tax estimator</CardTitle>
              <CardDescription>
                Estimate the income tax payable on your company profits and understand how eligibility for the
                base rate entity impacts cash flow.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="turnover">Aggregated turnover</Label>
              <Input
                id="turnover"
                inputMode="decimal"
                placeholder="e.g. 48000000"
                value={turnover}
                onChange={(event) => setTurnover(event.target.value)}
              />
              <p className="text-xs text-slate-500">Include group entities connected or affiliated with your company.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passiveIncome">Passive income %</Label>
              <Input
                id="passiveIncome"
                inputMode="decimal"
                placeholder="e.g. 35"
                value={passiveIncomeRatio}
                onChange={(event) => setPassiveIncomeRatio(event.target.value)}
              />
              <p className="text-xs text-slate-500">Dividends, interest, rent and similar revenue as a % of total income.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxableIncome">Taxable income for the year</Label>
            <Input
              id="taxableIncome"
              inputMode="decimal"
              placeholder="e.g. 325000"
              value={taxableIncome}
              onChange={(event) => setTaxableIncome(event.target.value)}
            />
            <p className="text-xs text-slate-500">Apply adjustments for add-backs, temporary differences and carried-forward losses first.</p>
          </div>
          <Alert className="border-violet-200 bg-violet-50 text-violet-800">
            Base rate entities currently apply when aggregated turnover is $50m or less and no more than 80% of income is
            passive. Confirm eligibility with your advisor before relying on the lower rate.
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingUpIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">Results</CardTitle>
              <CardDescription>Compare the two company tax scenarios.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className={`rounded-lg border p-4 ${qualifiesForBaseRate ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-emerald-900">Base rate entity</p>
                <Badge variant={qualifiesForBaseRate ? 'default' : 'outline'}>Rate {formatPercent(baseRate.rate)}</Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold text-emerald-900">{formatCurrency(baseRateTax)}</p>
              <p className="mt-1 text-xs text-emerald-800">Applies to eligible companies. {baseRate.criteria}</p>
            </div>
            <div className={`rounded-lg border p-4 ${qualifiesForBaseRate ? 'border-slate-200 bg-white shadow-sm' : 'border-rose-200 bg-rose-50'}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-rose-900">Full company rate</p>
                <Badge variant={!qualifiesForBaseRate ? 'default' : 'outline'}>Rate {formatPercent(fullRate.rate)}</Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold text-rose-900">{formatCurrency(fullRateTax)}</p>
              <p className="mt-1 text-xs text-rose-800">{fullRate.criteria}</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              Recommended rate: <span className="font-semibold">{formatPercent(recommendedRate)}</span>{' '}
              ({qualifiesForBaseRate ? 'base rate entity' : 'full company rate'})
            </p>
            <p className="mt-2">
              Estimated company tax payable: <span className="font-semibold">{formatCurrency(recommendedTax)}</span>
            </p>
            {parsedTaxableIncome > 0 ? (
              <p className="mt-2 text-xs text-slate-600">
                After-tax profit estimate: {formatCurrency(parsedTaxableIncome - recommendedTax)}
              </p>
            ) : null}
            {parsedTaxableIncome > 0 && Math.abs(savingsCompared) > 0 ? (
              <p className="mt-2 text-xs text-slate-600">
                Difference between rates: {formatCurrency(Math.abs(savingsCompared))}{' '}
                {savingsCompared > 0 ? 'saved with base rate' : 'additional tax if base rate not available'}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
