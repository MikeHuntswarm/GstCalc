import { useState } from 'react';
import { LineChartIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPercent } from '@/lib/utils';
import { sendNotification } from '@/lib/notifications';
import type { InterestRates } from '@/types/ato';

interface InterestBenchmarksProps {
  interestRates: InterestRates;
}

export function InterestBenchmarks({ interestRates }: InterestBenchmarksProps) {
  const gicRates = interestRates.generalInterestCharge.quarterlyRates ?? [];
  const benchmarkRates = interestRates.benchmarkInterest?.quarterlyRates ?? [];

  const now = Date.now();
  const upcomingGic =
    gicRates.find((p) => new Date(p.effectiveFrom).getTime() > now) ?? gicRates[0];
  const [gicReminderSent, setGicReminderSent] = useState(false);

  const handleGicReminder = () => {
    if (!upcomingGic) return;
    sendNotification(
      'GIC rate reminder',
      `General Interest Charge rate ${formatPercent(upcomingGic.rate)} applies from ${new Date(upcomingGic.effectiveFrom).toLocaleDateString('en-AU')}.`,
    );
    setGicReminderSent(true);
  };

  return (
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
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            General Interest Charge
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {interestRates.generalInterestCharge.description}
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {gicRates.map((period) => (
              <li
                key={`${period.label}-${period.effectiveFrom}`}
                className="flex items-center justify-between rounded-md bg-white px-3 py-2 shadow-sm dark:bg-slate-800"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {period.label}
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
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
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
              Division 7A benchmark
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {interestRates.benchmarkInterest.description}
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {benchmarkRates.map((period) => (
                <li
                  key={`${period.label}-${period.effectiveFrom}`}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900"
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {period.label}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatPercent(period.rate)}
                  </span>
                </li>
              ))}
            </ul>
            {interestRates.benchmarkInterest.frankingNotes ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {interestRates.benchmarkInterest.frankingNotes}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
