import { useMemo } from 'react';
import { CalendarCheckIcon, LightbulbIcon, BellIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { sendNotification } from '@/lib/notifications';
import { useAtoStore } from '@/store/ato';
import { useRemindersStore } from '@/store/reminders';

import { CompanyTaxReference } from './business/CompanyTaxReference';
import { GstBasHelper } from './business/GstBasHelper';
import { BasSchedule } from './business/BasSchedule';
import { SmallBusinessConcessions } from './business/SmallBusinessConcessions';
import { PenaltyAwareness } from './business/PenaltyAwareness';
import { InterestBenchmarks } from './business/InterestBenchmarks';

export function BusinessTools() {
  const { data: atoData } = useAtoStore();
  const baseRate = atoData?.company.baseRateEntity;
  const fullRate = atoData?.company.fullRate;
  const penalties = atoData?.penalties;
  const lodgements = atoData?.lodgements;
  const taxPlanning = atoData?.taxPlanning;
  const smallBusiness = atoData?.smallBusiness;
  const interestRates = atoData?.interestRates;

  const { reminders, addReminder, removeReminder } = useRemindersStore();

  const reminderLabels = useMemo(() => reminders.map((r) => r.label), [reminders]);

  const toggleReminder = (quarter: { label: string; standardDueDate: string }) => {
    const existingReminder = reminders.find((r) => r.label === quarter.label);
    if (existingReminder) {
      removeReminder(existingReminder.id);
    } else {
      addReminder({
        label: quarter.label,
        dueDate: quarter.standardDueDate,
        category: 'bas',
        notifyDaysBefore: [7, 3, 1],
      });
      sendNotification(
        'BAS Reminder Set',
        `You will be reminded about the ${quarter.label} lodgement.`,
      );
    }
  };

  if (!baseRate || !fullRate || !penalties) {
    return (
      <Alert variant="warning">
        Company tax and penalty data is unavailable. Try refreshing ATO rates and check your network
        connection before using the business tools.
      </Alert>
    );
  }

  const basQuarters = lodgements?.basQuarters ?? [];
  const annualObligations = lodgements?.annualObligations ?? [];
  const strategies = taxPlanning?.strategies ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CompanyTaxReference baseRate={baseRate} fullRate={fullRate} />
      <GstBasHelper gstRate={atoData?.gst.standardRate ?? 0.1} />

      {basQuarters.length > 0 ? (
        <BasSchedule
          basQuarters={basQuarters}
          reminderLabels={reminderLabels}
          onToggleReminder={toggleReminder}
        />
      ) : null}

      {smallBusiness &&
      (smallBusiness.instantAssetWriteOff || smallBusiness.simplifiedDepreciation) ? (
        <SmallBusinessConcessions
          instantAsset={smallBusiness.instantAssetWriteOff}
          depreciationPool={smallBusiness.simplifiedDepreciation}
          reminder={smallBusiness.reminder}
        />
      ) : null}

      <PenaltyAwareness penalties={penalties} />

      {interestRates ? <InterestBenchmarks interestRates={interestRates} /> : null}

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
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                  Quarterly BAS
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {basQuarters.map((quarter) => (
                    <div
                      key={quarter.label}
                      className="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-sky-900 dark:text-sky-100">
                          {quarter.label}
                        </h4>
                        <Badge variant="outline">Due {quarter.standardDueDate}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-sky-800 dark:text-sky-400">
                        {quarter.period}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        {quarter.notes ? (
                          <p className="text-xs text-sky-700 dark:text-sky-300">{quarter.notes}</p>
                        ) : (
                          <div />
                        )}
                        <Button
                          size="sm"
                          variant={reminderLabels.includes(quarter.label) ? 'default' : 'outline'}
                          onClick={() => toggleReminder(quarter)}
                          className="gap-2"
                        >
                          <BellIcon className="h-4 w-4" />
                          {reminderLabels.includes(quarter.label) ? 'Reminder set' : 'Remind me'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {annualObligations.length > 0 ? (
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                  Key annual lodgements
                </p>
                <div className="mt-3 space-y-3">
                  {annualObligations.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.name}
                        </h4>
                        <Badge variant="outline">Due {item.dueDate}</Badge>
                      </div>
                      {item.notes ? (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          {item.notes}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="text-xs text-slate-500 dark:text-slate-400">
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
            <p className="text-xs text-slate-500 dark:text-slate-400">{taxPlanning?.disclaimer}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {strategies.map((strategy) => (
                <div
                  key={strategy.title}
                  className="space-y-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-800 dark:bg-slate-800"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      {strategy.title}
                    </h4>
                    <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                      {strategy.summary}
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    {strategy.actions.map((action) => (
                      <li
                        key={action}
                        className="rounded bg-emerald-50 px-3 py-2 dark:bg-emerald-950"
                      >
                        {action}
                      </li>
                    ))}
                  </ul>
                  {strategy.caution ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300">{strategy.caution}</p>
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
