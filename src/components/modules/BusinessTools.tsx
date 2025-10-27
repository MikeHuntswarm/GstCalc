import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  AlertTriangleIcon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarClockIcon,
  LightbulbIcon,
  BellIcon,
  PackageCheckIcon,
  LineChartIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { estimateFailureToLodgePenalty } from '@/lib/calculations/penalties';
import { sendNotification } from '@/lib/notifications';
import { useAtoStore } from '@/store/ato';

interface Reminder {
  label: string;
  dueDate: string;
}

export function BusinessTools() {
  const {
    data: atoData,
  } = useAtoStore();
  const baseRate = atoData?.company.baseRateEntity;
  const fullRate = atoData?.company.fullRate;
  const penalties = atoData?.penalties;
  const gstRate = atoData?.gst.standardRate ?? 0.1;
  const lodgements = atoData?.lodgements;
  const taxPlanning = atoData?.taxPlanning;
  const smallBusiness = atoData?.smallBusiness;
  const interestRates = atoData?.interestRates;

  const [sales, setSales] = useState('');
  const [gstCollected, setGstCollected] = useState('');
  const [gstCredits, setGstCredits] = useState('');
  const [daysLate, setDaysLate] = useState('');
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const storedReminders = localStorage.getItem('gstcalc-reminders');
    if (storedReminders) {
      setReminders(JSON.parse(storedReminders));
    }
  }, []);

  const parsedSales = useMemo(() => parseFloat(sales.replace(/[^0-9.-]/g, '')) || 0, [sales]);
  const parsedGstCollected = useMemo(
    () => parseFloat(gstCollected.replace(/[^0-9.-]/g, '')) || 0,
    [gstCollected],
  );
  const parsedGstCredits = useMemo(
    () => parseFloat(gstCredits.replace(/[^0-9.-]/g, '')) || 0,
    [gstCredits],
  );
  const parsedDaysLate = useMemo(() => Math.max(0, parseInt(daysLate || '0', 10) || 0), [daysLate]);

  const netGst = useMemo(
    () => parsedGstCollected - parsedGstCredits,
    [parsedGstCollected, parsedGstCredits],
  );
  const ftlEstimate = useMemo(() => {
    if (!penalties) {
      return { penaltyUnits: 0, amount: 0, periodsLate: 0 };
    }
    return estimateFailureToLodgePenalty(parsedDaysLate, penalties.failureToLodge);
  }, [parsedDaysLate, penalties]);

  const basQuarters = lodgements?.basQuarters ?? [];
  const annualObligations = lodgements?.annualObligations ?? [];
  const strategies = taxPlanning?.strategies ?? [];
  const instantAsset = smallBusiness?.instantAssetWriteOff;
  const simplifiedDepreciation = smallBusiness?.simplifiedDepreciation;
  const gicRates = interestRates?.generalInterestCharge.quarterlyRates ?? [];
  const benchmarkRates = interestRates?.benchmarkInterest?.quarterlyRates ?? [];

  const upcomingGic = useMemo(() => {
    if (gicRates.length === 0) {
      return null;
    }
    const now = Date.now();
    const future = gicRates.find((period) => new Date(period.effectiveFrom).getTime() > now);
    return future ?? gicRates[0];
  }, [gicRates]);

  const [gicReminderSent, setGicReminderSent] = useState(false);

  const handleGicReminder = useCallback(() => {
    if (!upcomingGic) {
      return;
    }
    sendNotification(
      'GIC rate reminder',
      `General Interest Charge rate ${formatPercent(upcomingGic.rate)} applies from ${new Date(upcomingGic.effectiveFrom).toLocaleDateString('en-AU')}.`,
    );
    setGicReminderSent(true);
  }, [upcomingGic]);

  const toggleReminder = (quarter: { label: string; standardDueDate: string }) => {
    const isReminderSet = reminders.some((r) => r.label === quarter.label);
    const newReminders = isReminderSet
      ? reminders.filter((r) => r.label !== quarter.label)
      : [...reminders, { label: quarter.label, dueDate: quarter.standardDueDate }];

    setReminders(newReminders);
    localStorage.setItem('gstcalc-reminders', JSON.stringify(newReminders));

    if (!isReminderSet) {
      sendNotification(
        'BAS Reminder Set',
        `You will be reminded about the ${quarter.label} lodgement.`,
      );
    }
  };

  if (!baseRate || !fullRate || !penalties) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Building2Icon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">Company tax quick reference</CardTitle>
              <CardDescription>
                Understand the company tax rate that applies based on your turnover and passive
                income mix.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-xs uppercase text-indigo-700">Base rate entity</p>
              <p className="mt-2 text-3xl font-semibold text-indigo-900">
                {formatPercent(baseRate.rate)}
              </p>
              <p className="mt-2 text-sm text-indigo-900/80">{baseRate.criteria}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-slate-500">Full company rate</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {formatPercent(fullRate.rate)}
              </p>
              <p className="mt-2 text-sm text-slate-600">{fullRate.criteria}</p>
            </div>
          </div>
          <Alert>
            Companies that qualify for the base rate entity concessions must also apply the lower
            company tax rate when franking distributions.
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <CalendarClockIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">GST BAS helper</CardTitle>
              <CardDescription>
                Summarise GST collected and credits to estimate your 1A and 1B figures.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sales">Total sales (G1)</Label>
              <Input
                id="sales"
                inputMode="decimal"
                value={sales}
                placeholder="e.g. 125000"
                onChange={(event) => setSales(event.target.value)}
              />
              <p className="text-xs text-slate-500">
                Include GST in this figure if you report on a GST-inclusive basis - the autofill
                assumes the total is GST inclusive.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstCollected">GST collected (1A)</Label>
              <Input
                id="gstCollected"
                inputMode="decimal"
                value={gstCollected}
                placeholder="e.g. 12500"
                onChange={(event) => setGstCollected(event.target.value)}
              />
              <p className="text-xs text-slate-500">
                Total GST on sales and other taxable supplies.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstCredits">GST credits (1B)</Label>
              <Input
                id="gstCredits"
                inputMode="decimal"
                value={gstCredits}
                placeholder="e.g. 8500"
                onChange={(event) => setGstCredits(event.target.value)}
              />
              <p className="text-xs text-slate-500">
                Include all input tax credits you are entitled to claim.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div>
              <p className="text-xs uppercase text-amber-700">Net GST payable / refund</p>
              <p className="text-2xl font-semibold text-amber-900">{formatCurrency(netGst)}</p>
            </div>
            <Badge variant={netGst >= 0 ? 'warning' : 'outline'}>
              {netGst >= 0 ? 'Payable (1A - 1B)' : 'Refund due'}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const gstOnSales = parsedSales * (gstRate / (1 + gstRate));
                setGstCollected(gstOnSales.toFixed(2));
              }}
            >
              Autofill GST on sales ({formatPercent(gstRate)})
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Tip: lodge and pay by the due date to avoid Failure to Lodge penalties and daily
            interest charges.
          </p>
        </CardContent>
      </Card>

      {smallBusiness && (instantAsset || simplifiedDepreciation) ? (
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <PackageCheckIcon className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-2xl">Instant asset write-off & pooling</CardTitle>
                <CardDescription>
                  Check eligibility for the temporary instant asset write-off and simplified
                  depreciation pool.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {instantAsset ? (
              <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase text-emerald-700">Instant asset write-off</p>
                <p className="text-2xl font-semibold text-emerald-900">
                  {formatCurrency(instantAsset.threshold)}
                </p>
                <p className="text-xs text-emerald-800">{instantAsset.effectivePeriod}</p>
                <p className="text-sm text-emerald-900/80">{instantAsset.eligibility}</p>
                {instantAsset.notes ? (
                  <p className="text-xs text-emerald-700">{instantAsset.notes}</p>
                ) : null}
              </div>
            ) : null}

            {simplifiedDepreciation ? (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Simplified depreciation pool</p>
                <div className="text-sm text-slate-700">
                  <p>
                    Pool balance threshold:{' '}
                    <span className="font-semibold">
                      {formatCurrency(simplifiedDepreciation.threshold)}
                    </span>
                  </p>
                  <p className="mt-2">
                    First year rate:{' '}
                    <span className="font-semibold">
                      {formatPercent(simplifiedDepreciation.firstYearRate)}
                    </span>
                  </p>
                  <p>
                    Subsequent years:{' '}
                    <span className="font-semibold">
                      {formatPercent(simplifiedDepreciation.subsequentRate)}
                    </span>
                  </p>
                </div>
                <p className="text-sm text-slate-600">{simplifiedDepreciation.eligibility}</p>
                {simplifiedDepreciation.notes ? (
                  <p className="text-xs text-slate-500">{simplifiedDepreciation.notes}</p>
                ) : null}
              </div>
            ) : null}

            {smallBusiness?.reminder ? (
              <Alert className="md:col-span-2">
                <p className="text-sm text-slate-700">{smallBusiness.reminder}</p>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="lg:col-span-2">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <AlertTriangleIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">Penalty awareness</CardTitle>
              <CardDescription>
                Estimate Failure to Lodge penalties and understand how quickly costs can escalate.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="daysLate">Days late lodging BAS or tax return</Label>
              <Input
                id="daysLate"
                inputMode="numeric"
                value={daysLate}
                placeholder="e.g. 35"
                onChange={(event) => setDaysLate(event.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 md:col-span-3">
              <p className="text-xs uppercase text-red-700">Failure to Lodge penalty estimate</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-sm text-red-800">Penalty units</p>
                  <p className="text-2xl font-semibold text-red-900">{ftlEstimate.penaltyUnits}</p>
                </div>
                <div>
                  <p className="text-sm text-red-800">Dollar impact</p>
                  <p className="text-2xl font-semibold text-red-900">
                    {formatCurrency(ftlEstimate.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-red-800">28-day periods late</p>
                  <p className="text-2xl font-semibold text-red-900">{ftlEstimate.periodsLate}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-red-800">{penalties.failureToLodge.description}</p>
              <p className="mt-2 text-xs text-red-700">
                Penalty unit value: {formatCurrency(penalties.failureToLodge.unitValue)}. Capped at{' '}
                {` ${penalties.failureToLodge.maxUnits} `}units for small entities.
              </p>
            </div>
          </div>
          <Alert variant="warning">
            {penalties.generalInterestCharge.description} Plan for cash flow ahead of time or
            contact the ATO to negotiate a payment arrangement.
          </Alert>
        </CardContent>
      </Card>

      {interestRates ? (
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <LineChartIcon className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-2xl">ATO interest benchmarks</CardTitle>
                <CardDescription>
                  Track current General Interest Charge and benchmark interest rates applied to tax
                  debts and Division 7A loans.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">General Interest Charge</p>
              <p className="text-sm text-slate-700">{interestRates.generalInterestCharge.description}</p>
              <ul className="space-y-2 text-xs text-slate-600">
                {gicRates.map((period) => (
                  <li
                    key={`${period.label}-${period.effectiveFrom}`}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-2 shadow-sm"
                  >
                    <span className="font-semibold text-slate-700">{period.label}</span>
                    <span className="text-sm font-medium text-slate-900">
                      {formatPercent(period.rate)}
                    </span>
                  </li>
                ))}
              </ul>
              {upcomingGic ? (
                <Button
                  type="button"
                  variant={gicReminderSent ? 'outline' : 'default'}
                  size="sm"
                  className="gap-2"
                  onClick={handleGicReminder}
                  disabled={gicReminderSent}
                >
                  {gicReminderSent ? 'Reminder scheduled' : 'Remind me next quarter'}
                </Button>
              ) : null}
            </div>
            {interestRates.benchmarkInterest ? (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Division 7A benchmark</p>
                <p className="text-sm text-slate-700">
                  {interestRates.benchmarkInterest.description}
                </p>
                <ul className="space-y-2 text-xs text-slate-600">
                  {benchmarkRates.map((period) => (
                    <li
                      key={`${period.label}-${period.effectiveFrom}`}
                      className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
                    >
                      <span className="font-semibold text-slate-700">{period.label}</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatPercent(period.rate)}
                      </span>
                    </li>
                  ))}
                </ul>
                {interestRates.benchmarkInterest.frankingNotes ? (
                  <p className="text-xs text-slate-500">
                    {interestRates.benchmarkInterest.frankingNotes}
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {(basQuarters.length > 0 || annualObligations.length > 0) && (
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <CalendarCheckIcon className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-2xl">Lodgement calendar</CardTitle>
                <CardDescription>
                  Keep an eye on the next BAS deadline and annual obligations so nothing slips
                  through the cracks.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {basQuarters.length > 0 ? (
              <div>
                <p className="text-xs uppercase text-slate-500">Quarterly BAS</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {basQuarters.map((quarter) => (
                    <div
                      key={quarter.label}
                      className="rounded-lg border border-sky-200 bg-sky-50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-sky-900">{quarter.label}</h4>
                        <Badge variant="outline">Due {quarter.standardDueDate}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-sky-800">{quarter.period}</p>
                      <div className="mt-3 flex items-center justify-between">
                        {quarter.notes ? (
                          <p className="text-xs text-sky-700">{quarter.notes}</p>
                        ) : (
                          <div />
                        )}
                        <Button
                          size="sm"
                          variant={reminders.some((r) => r.label === quarter.label) ? 'default' : 'outline'}
                          onClick={() => toggleReminder(quarter)}
                          className="gap-2"
                        >
                          <BellIcon className="h-4 w-4" />
                          {reminders.some((r) => r.label === quarter.label) ? 'Reminder set' : 'Remind me'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {annualObligations.length > 0 ? (
              <div>
                <p className="text-xs uppercase text-slate-500">Key annual lodgements</p>
                <div className="mt-3 space-y-3">
                  {annualObligations.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{item.name}</h4>
                        <Badge variant="outline">Due {item.dueDate}</Badge>
                      </div>
                      {item.notes ? (
                        <p className="mt-2 text-xs text-slate-600">{item.notes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="text-xs text-slate-500">
              Always confirm due dates in Online services for business or with your registered tax
              or BAS agent because the ATO can grant different lodgement programs.
            </p>
          </CardContent>
        </Card>
      )}

      {strategies.length > 0 ? (
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <LightbulbIcon className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-2xl">Tax mitigation ideas</CardTitle>
                <CardDescription>
                  Explore conversation starters for your advisor to help manage taxable income and
                  cash flow.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-xs text-slate-500">{taxPlanning?.disclaimer}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {strategies.map((strategy) => (
                <div
                  key={strategy.title}
                  className="space-y-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-900">{strategy.title}</h4>
                    <p className="mt-1 text-xs text-emerald-800">{strategy.summary}</p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {strategy.actions.map((action) => (
                      <li key={action} className="rounded bg-emerald-50 px-3 py-2">
                        {action}
                      </li>
                    ))}
                  </ul>
                  {strategy.caution ? (
                    <p className="text-xs text-amber-700">{strategy.caution}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
