import { useEffect, useMemo } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { GstCalculator } from '@/components/modules/GstCalculator';
import { IncomeTaxCalculator } from '@/components/modules/IncomeTaxCalculator';
import { BusinessTools } from '@/components/modules/BusinessTools';
import { AnnualBusinessTax } from '@/components/modules/AnnualBusinessTax';
import { Updater } from '@/components/modules/Updater';
import { useAtoStore } from '@/store/ato';
import { formatPercent } from '@/lib/utils';
import { sendNotification } from '@/lib/notifications';
import { parse, differenceInCalendarDays } from 'date-fns';

interface Reminder {
  label: string;
  dueDate: string;
}

function LoadingState({ message }: { message: string }) {
  return <Alert className="border-blue-200 bg-blue-50 text-blue-900">{message}</Alert>;
}

function ErrorState({ message }: { message: string }) {
  return <Alert variant="warning">{message}</Alert>;
}

export default function App() {
  const {
    data,
    status,
    error,
    stale,
    fetchAtoRates,
    refresh,
  } = useAtoStore();

  useEffect(() => {
    fetchAtoRates();
  }, [fetchAtoRates]);

  useEffect(() => {
    const storedReminders = localStorage.getItem('gstcalc-reminders');
    if (storedReminders) {
      const reminders = JSON.parse(storedReminders) as Reminder[];
      const now = new Date();

      reminders.forEach((reminder) => {
        if (reminder.dueDate) {
          const dueDate = parse(reminder.dueDate, 'd MMMM yyyy', new Date());
          const daysUntilDue = differenceInCalendarDays(dueDate, now);

          if (daysUntilDue > 0 && daysUntilDue <= 7) {
            sendNotification(
              'Upcoming BAS Lodgement',
              `Your ${reminder.label} is due in ${daysUntilDue} days.`,
            );
          }
        }
      });
    }
  }, []);

  const gstRate = data?.gst.standardRate ?? 0.1;
  const gstNotes = data?.gst.notes;
  const financialYears = useMemo(() => data?.individual.financialYears ?? [], [data]);
  const lastUpdated = data?.metadata.lastUpdated ?? new Date().toISOString();
  const companyRates = data?.company;
  const penalties = data?.penalties;

  const readyForIndividual = financialYears.length > 0;
  const readyForBusiness = Boolean(companyRates && penalties);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-white">
                GSTCalc
              </span>
              <Badge variant="outline">
                Up-to-date rates{' '}
                {lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-AU') : ''}
              </Badge>
            </div>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              A desktop-first toolkit for Australian individuals and businesses to calculate GST,
              estimate income tax and stay ahead of BAS deadlines.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              GST rate {formatPercent(gstRate)}
              {gstNotes ? ` · ${gstNotes}` : ''}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              className="gap-2"
            >
              <RefreshCwIcon className="h-4 w-4" /> Refresh rates
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {status === 'loading' ? (
          <LoadingState message="Fetching the latest rates from the ATO..." />
        ) : null}
        {error ? <ErrorState message={`Using cached data. ${error}`} /> : null}
        {stale ? (
          <Alert variant="warning">
            Cached rates may be out of date. Refresh when you are back online to pull the latest
            data from the ATO.
          </Alert>
        ) : null}

        <Tabs defaultValue="individual" className="space-y-6">
          <TabsList className="self-start">
            <TabsTrigger value="individual">Individual tools</TabsTrigger>
            <TabsTrigger value="business">Business tools</TabsTrigger>
            <TabsTrigger value="annual-tax">Annual business tax</TabsTrigger>
            <TabsTrigger value="updater">App Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-6">
            <GstCalculator />
            {readyForIndividual ? (
              <IncomeTaxCalculator />
            ) : (
              <Alert variant="warning">
                Income tax rates are unavailable. Try refreshing the data source.
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <GstCalculator />
            {readyForBusiness && companyRates && penalties ? (
              <BusinessTools />
            ) : (
              <Alert variant="warning">
                Company tax rates and penalty schedules are unavailable right now.
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="annual-tax" className="space-y-6">
            {readyForBusiness && companyRates ? (
              <AnnualBusinessTax
                baseRate={companyRates.baseRateEntity}
                fullRate={companyRates.fullRate}
              />
            ) : (
              <Alert variant="warning">
                Company rate data is unavailable. Refresh the dataset to try again.
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="updater">
            <Updater />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            GSTCalc is not financial advice. Verify calculations with the Australian Taxation Office
            or a registered tax agent.
          </p>
          <p>Offline mode caches the last downloaded rate schedule for up to seven days.</p>
        </div>
      </footer>
    </div>
  );
}
