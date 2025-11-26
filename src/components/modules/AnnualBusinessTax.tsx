import { useMemo, useState } from 'react';
import { CalculatorIcon, TrendingUpIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { useAtoStore } from '@/store/ato';

type ChecklistStatus = 'ok' | 'issue' | 'pending';

type ChecklistItem = {
  id: string;
  label: string;
  status: ChecklistStatus;
  detail: string;
};

const CHECKLIST_STATUS_STYLES: Record<ChecklistStatus, string> = {
  ok: 'bg-emerald-100 text-emerald-700',
  issue: 'bg-rose-100 text-rose-700',
  pending: 'bg-slate-200 text-slate-700',
};

const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  ok: 'Met',
  issue: 'Review',
  pending: 'Pending',
};

function parseAmount(value: string) {
  return Number.parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
}

function formatList(items: string[]) {
  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  const allButLast = items.slice(0, -1);
  const last = items[items.length - 1];
  return `${allButLast.join(', ')} and ${last}`;
}

export function AnnualBusinessTax() {
  const {
    data: atoData,
  } = useAtoStore();
  const baseRate = atoData?.company.baseRateEntity;
  const fullRate = atoData?.company.fullRate;
  const BASE_RATE_TURNOVER_CAP = baseRate?.baseRateTurnoverCap ?? 50_000_000;
  const PASSIVE_INCOME_MAX_PERCENT = baseRate?.passiveIncomeMaxPercent ?? 80;

  const [turnover, setTurnover] = useState('');
  const [taxableIncome, setTaxableIncome] = useState('');
  const [passiveIncomeRatio, setPassiveIncomeRatio] = useState('');

  function handlePassiveIncomeChange(rawValue: string) {
    if (rawValue.trim().length === 0) {
      setPassiveIncomeRatio('');
      return;
    }

    const numeric = Number.parseFloat(rawValue);

    if (Number.isNaN(numeric)) {
      setPassiveIncomeRatio('');
      return;
    }

    const clamped = Math.min(100, Math.max(0, numeric));
    setPassiveIncomeRatio(clamped.toString());
  }

  const parsedTurnover = useMemo(() => Math.max(0, parseAmount(turnover)), [turnover]);
  const parsedTaxableIncome = useMemo(
    () => Math.max(0, parseAmount(taxableIncome)),
    [taxableIncome],
  );
  const parsedPassiveIncomeRatio = useMemo(() => {
    const numeric = Number.parseFloat(passiveIncomeRatio.replace(/[^0-9.]/g, '')) || 0;
    return Math.min(100, Math.max(0, numeric));
  }, [passiveIncomeRatio]);

  const hasTurnoverInput = turnover.trim().length > 0;
  const hasTaxableIncomeInput = taxableIncome.trim().length > 0;
  const hasPassiveIncomeInput = passiveIncomeRatio.trim().length > 0;

  const missingInputs: string[] = [];
  if (!hasTurnoverInput) {
    missingInputs.push('aggregated turnover');
  }
  if (!hasPassiveIncomeInput) {
    missingInputs.push('passive income percentage');
  }
  if (!hasTaxableIncomeInput) {
    missingInputs.push('taxable income');
  }

  const isReadyForResults = missingInputs.length === 0;
  const missingInputSummary = formatList(missingInputs);

  const turnoverThresholdExceeded = hasTurnoverInput && parsedTurnover > BASE_RATE_TURNOVER_CAP;
  const passiveThresholdExceeded =
    hasPassiveIncomeInput && parsedPassiveIncomeRatio > PASSIVE_INCOME_MAX_PERCENT;

  const qualifiesForBaseRate = useMemo(() => {
    return (
      parsedTurnover <= BASE_RATE_TURNOVER_CAP &&
      parsedPassiveIncomeRatio <= PASSIVE_INCOME_MAX_PERCENT
    );
  }, [parsedTurnover, parsedPassiveIncomeRatio, BASE_RATE_TURNOVER_CAP, PASSIVE_INCOME_MAX_PERCENT]);

  const baseRateTax = useMemo(
    () => parsedTaxableIncome * (baseRate?.rate ?? 0),
    [parsedTaxableIncome, baseRate],
  );
  const fullRateTax = useMemo(
    () => parsedTaxableIncome * (fullRate?.rate ?? 0),
    [parsedTaxableIncome, fullRate],
  );
  const recommendedTax = qualifiesForBaseRate ? baseRateTax : fullRateTax;
  const recommendedRate = qualifiesForBaseRate ? baseRate?.rate ?? 0 : fullRate?.rate ?? 0;
  const savingsCompared = fullRateTax - baseRateTax;
  const effectiveTaxRate = parsedTaxableIncome > 0 ? recommendedTax / parsedTaxableIncome : 0;
  const relativeSavingsToFullRate = fullRateTax > 0 ? Math.abs(savingsCompared) / fullRateTax : 0;
  const afterTaxProfit = parsedTaxableIncome - recommendedTax;

  const baseRateTurnoverCapLabel = useMemo(() => formatCurrency(BASE_RATE_TURNOVER_CAP), [BASE_RATE_TURNOVER_CAP]);
  const passiveIncomeThresholdLabel = useMemo(() => `${PASSIVE_INCOME_MAX_PERCENT}%`, [PASSIVE_INCOME_MAX_PERCENT]);

  const baseRateEligibilityReasons = useMemo(() => {
    const reasons: string[] = [];

    if (turnoverThresholdExceeded) {
      reasons.push(
        `Aggregated turnover is above the ${baseRateTurnoverCapLabel} cap for base rate entities.`,
      );
    }

    if (passiveThresholdExceeded) {
      reasons.push(`Passive income exceeds ${passiveIncomeThresholdLabel} of total income.`);
    }

    return reasons;
  }, [
    turnoverThresholdExceeded,
    passiveThresholdExceeded,
    baseRateTurnoverCapLabel,
    passiveIncomeThresholdLabel,
  ]);

  const eligibilityChecklist = useMemo<ChecklistItem[]>(() => {
    const items: ChecklistItem[] = [];

    const turnoverStatus: ChecklistStatus = !hasTurnoverInput
      ? 'pending'
      : turnoverThresholdExceeded
        ? 'issue'
        : 'ok';

    items.push({
      id: 'turnover',
      label: 'Aggregated turnover',
      status: turnoverStatus,
      detail:
        turnoverStatus === 'pending'
          ? 'Enter aggregated turnover to evaluate base rate eligibility.'
          : turnoverStatus === 'issue'
            ? `Turnover exceeds the ${baseRateTurnoverCapLabel} cap for base rate entities.`
            : `Turnover remains within the ${baseRateTurnoverCapLabel} base rate threshold.`,
    });

    const passiveStatus: ChecklistStatus = !hasPassiveIncomeInput
      ? 'pending'
      : passiveThresholdExceeded
        ? 'issue'
        : 'ok';

    items.push({
      id: 'passive-income',
      label: 'Passive income mix',
      status: passiveStatus,
      detail:
        passiveStatus === 'pending'
          ? 'Add passive income as a percentage of total income to complete the assessment.'
          : passiveStatus === 'issue'
            ? `Passive income is above the ${passiveIncomeThresholdLabel} allowance for base rate entities.`
            : `Passive income is within the ${passiveIncomeThresholdLabel} allowance.`,
    });

    const taxableStatus: ChecklistStatus = hasTaxableIncomeInput ? 'ok' : 'pending';

    items.push({
      id: 'taxable-income',
      label: 'Taxable income prepared',
      status: taxableStatus,
      detail:
        taxableStatus === 'pending'
          ? 'Enter taxable income for the year to calculate company tax payable and after-tax profit.'
          : 'Taxable income captured — estimates are up to date.',
    });

    return items;
  }, [
    hasPassiveIncomeInput,
    hasTaxableIncomeInput,
    hasTurnoverInput,
    passiveIncomeThresholdLabel,
    passiveThresholdExceeded,
    turnoverThresholdExceeded,
    baseRateTurnoverCapLabel,
  ]);

  const showBaseRateWarning = isReadyForResults && baseRateEligibilityReasons.length > 0;

  if (!baseRate || !fullRate) {
    return null;
  }

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
                Estimate the income tax payable on your company profits and understand how
                eligibility for the base rate entity impacts cash flow.
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
              <p className="text-xs text-slate-500">
                Include group entities connected or affiliated with your company.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passiveIncome">Passive income %</Label>
              <Input
                id="passiveIncome"
                inputMode="decimal"
                placeholder="e.g. 35"
                value={passiveIncomeRatio}
                onChange={(event) => handlePassiveIncomeChange(event.target.value)}
              />
              <p className="text-xs text-slate-500">
                Dividends, interest, rent and similar revenue as a % of total income.
              </p>
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
            <p className="text-xs text-slate-500">
              Apply adjustments for add-backs, temporary differences and carried-forward losses
              first.
            </p>
          </div>
          <Alert className="border-violet-200 bg-violet-50 text-violet-800">
            Base rate entities currently apply when aggregated turnover is{' '}
            {baseRateTurnoverCapLabel} or less and no more than {passiveIncomeThresholdLabel} of
            income is passive. Confirm eligibility with your advisor before relying on the lower
            rate.
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
          {missingInputs.length > 0 ? (
            <Alert variant="warning">
              Provide {missingInputSummary} to view complete company tax estimates. Placeholder
              values are shown until all required inputs are supplied.
            </Alert>
          ) : showBaseRateWarning ? (
            <Alert variant="warning">
              <p className="font-semibold">Base rate entity criteria not met</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                {baseRateEligibilityReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </Alert>
          ) : (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
              Your entries currently meet the base rate entity criteria. Confirm details with your
              advisor before lodging.
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div
              data-testid="card-base-rate"
              className={`rounded-lg border p-4 ${
                qualifiesForBaseRate
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-emerald-900">Base rate entity</p>
                <Badge variant={qualifiesForBaseRate ? 'default' : 'outline'}>
                  Rate {formatPercent(baseRate.rate)}
                </Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold text-emerald-900">
                {formatCurrency(baseRateTax)}
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                Applies to eligible companies. {baseRate.criteria}
              </p>
            </div>
            <div
              data-testid="card-full-rate"
              className={`rounded-lg border p-4 ${
                qualifiesForBaseRate
                  ? 'border-slate-200 bg-white shadow-sm'
                  : 'border-rose-200 bg-rose-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-rose-900">Full company rate</p>
                <Badge variant={!qualifiesForBaseRate ? 'default' : 'outline'}>
                  Rate {formatPercent(fullRate.rate)}
                </Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold text-rose-900">
                {formatCurrency(fullRateTax)}
              </p>
              <p className="mt-1 text-xs text-rose-800">{fullRate.criteria}</p>
            </div>
          </div>

          <div
            data-testid="tax-summary"
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
          >
            <p>
              Recommended rate:{' '}
              <span className="font-semibold">{formatPercent(recommendedRate)}</span> (
              {qualifiesForBaseRate ? 'base rate entity' : 'full company rate'})
            </p>
            <p className="mt-2">
              Estimated company tax payable:{' '}
              <span className="font-semibold">{formatCurrency(recommendedTax)}</span>
            </p>
            {parsedTaxableIncome > 0 ? (
              <p className="mt-2 text-xs text-slate-600">
                After-tax profit estimate: {formatCurrency(afterTaxProfit)}
              </p>
            ) : null}
            {isReadyForResults && parsedTaxableIncome > 0 ? (
              <p className="mt-2 text-xs text-slate-600">
                Effective tax rate: {formatPercent(effectiveTaxRate)} of taxable income.
              </p>
            ) : null}
            {parsedTaxableIncome > 0 && Math.abs(savingsCompared) > 0 ? (
              <p className="mt-2 text-xs text-slate-600">
                {qualifiesForBaseRate
                  ? 'Estimated savings vs full rate'
                  : 'Additional tax versus base rate'}
                : {formatCurrency(Math.abs(savingsCompared))}
                {fullRateTax > 0 ? ` (${formatPercent(relativeSavingsToFullRate)})` : ''}.
              </p>
            ) : null}
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">Eligibility checkpoints</p>
            <ul className="space-y-3">
              {eligibilityChecklist.map((item) => (
                <li
                  key={item.id}
                  data-testid={`checklist-item-${item.id}`}
                  className="flex items-start gap-3 rounded-md bg-slate-50 p-3"
                >
                  <span
                    className={`inline-flex h-6 items-center rounded-full px-3 text-xs font-semibold ${CHECKLIST_STATUS_STYLES[item.status]}`}
                  >
                    {CHECKLIST_STATUS_LABELS[item.status]}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-600">{item.label}</p>
                    <p
                      data-testid={`checklist-detail-${item.id}`}
                      className="mt-1 text-xs text-slate-500"
                    >
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}