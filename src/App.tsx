import { useEffect, useMemo } from 'react';
import { RefreshCwIcon, MoonIcon, SunIcon } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GstCalculator } from '@/components/modules/GstCalculator';
import { IncomeTaxCalculator } from '@/components/modules/IncomeTaxCalculator';
import { BusinessTools } from '@/components/modules/BusinessTools';
import { MissedLodgements } from '@/components/modules/MissedLodgements';
import { LodgementHistory } from '@/components/modules/LodgementHistory';
import { AnnualBusinessTax } from '@/components/modules/AnnualBusinessTax';
import { Reminders } from '@/components/modules/Reminders';
import { Updater } from '@/components/modules/Updater';
import { OverviewDashboard } from '@/components/modules/OverviewDashboard';
import { FrankingCredits } from '@/components/modules/FrankingCredits';
import { SuperCalculator } from '@/components/modules/SuperCalculator';
import { Settings } from '@/components/modules/Settings';
import { useAtoStore } from '@/store/ato';
import { useRemindersStore } from '@/store/reminders';
import { useThemeStore } from '@/store/theme';
import { sendNotification } from '@/lib/notifications';
import { formatPercent } from '@/lib/utils';
import { logger } from '@/lib/logger';

const APP_VERSION = import.meta.env['VITE_APP_VERSION'] ?? '0.1.19';

function LoadingState({ message }: { message: string }) {
  return <Alert className="border-blue-200 bg-blue-50 text-blue-900">{message}</Alert>;
}

function ErrorState({ message }: { message: string }) {
  return <Alert variant="warning">{message}</Alert>;
}

export default function App() {
  const { data, status, error, stale, fetchAtoRates, refresh } = useAtoStore();

  const { checkDueReminders } = useRemindersStore();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    fetchAtoRates();
  }, [fetchAtoRates]);

  useEffect(() => {
    // Check for due reminders on app start and fire notifications
    const due = checkDueReminders();
    due.forEach(({ title, body }) => sendNotification(title, body));
  }, [checkDueReminders]);

  useEffect(() => {
    logger.info('GSTCalc application started', { version: APP_VERSION, theme });
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+R: Refresh ATO rates
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        refresh();
        toast.success('Refreshing ATO rates...');
      }
      // Ctrl+,: Open Settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        const el = document.querySelector('[data-value="settings"]');
        if (el instanceof HTMLElement) el.click();
      }
      // Ctrl+1-9: Jump to tab
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const tabs = document.querySelectorAll('[role="tab"]');
        const idx = parseInt(e.key) - 1;
        if (tabs[idx] instanceof HTMLElement) tabs[idx].click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refresh]);

  const gstRate = data?.gst.standardRate ?? 0.1;
  const gstNotes = data?.gst.notes;
  const financialYears = useMemo(() => data?.individual.financialYears ?? [], [data]);
  const lastUpdated = data?.metadata.lastUpdated ?? new Date().toISOString();
  const companyRates = data?.company;
  const penalties = data?.penalties;

  const readyForIndividual = financialYears.length > 0;
  const readyForBusiness = Boolean(companyRates && penalties);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 text-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-slate-100">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-white">
                  GSTCalc
                </span>
                <Badge variant="outline">
                  v{APP_VERSION} · ATO data effective{' '}
                  {lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-AU') : 'Pending'}
                </Badge>
              </div>
              <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                A desktop-first toolkit for Australian individuals and businesses to calculate GST,
                estimate income tax and stay ahead of BAS deadlines.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                GST rate {formatPercent(gstRate)}
                {gstNotes ? ` · ${gstNotes}` : ''}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="gap-2"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ||
                (theme === 'system' &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches) ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  refresh();
                  toast.success('Refreshing ATO rates...');
                }}
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
          {data && lastUpdated
            ? (() => {
                const daysSinceUpdate = Math.floor(
                  (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24),
                );
                if (daysSinceUpdate > 7) {
                  return (
                    <Alert variant="destructive">
                      ATO rate data is {daysSinceUpdate} days old. Tax brackets, penalty units, and
                      interest rates may have changed since{' '}
                      {new Date(lastUpdated).toLocaleDateString('en-AU')}. Click the Refresh rates
                      button above to pull the latest data.
                    </Alert>
                  );
                }
                return null;
              })()
            : null}

          <Tabs defaultValue="overview" className="space-y-6">
            <div className="overflow-x-auto pb-1">
              <TabsList className="inline-flex min-w-full self-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="individual">Individual tools</TabsTrigger>
                <TabsTrigger value="business">Business tools</TabsTrigger>
                <TabsTrigger value="lodgement-history">Lodgement History</TabsTrigger>
                <TabsTrigger value="catch-up">Catch-up planner</TabsTrigger>
                <TabsTrigger value="annual-tax">Annual business tax</TabsTrigger>
                <TabsTrigger value="reminders">Reminders</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="updater">App Updates</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <ErrorBoundary>
                <OverviewDashboard />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="individual" className="space-y-6">
              <ErrorBoundary>
                <GstCalculator />
                {readyForIndividual ? (
                  <IncomeTaxCalculator />
                ) : (
                  <Alert variant="warning">
                    Income tax rates are unavailable. Try refreshing the data source.
                  </Alert>
                )}
                <SuperCalculator />
                <FrankingCredits />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <ErrorBoundary>
                <GstCalculator />
                {readyForBusiness && companyRates && penalties ? (
                  <BusinessTools />
                ) : (
                  <Alert variant="warning">
                    Company tax rates and penalty schedules are unavailable right now.
                  </Alert>
                )}
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="lodgement-history" className="space-y-6">
              <ErrorBoundary>
                <LodgementHistory />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="catch-up" className="space-y-6">
              <ErrorBoundary>
                <MissedLodgements />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="annual-tax" className="space-y-6">
              <ErrorBoundary>
                {readyForBusiness && companyRates ? (
                  <AnnualBusinessTax />
                ) : (
                  <Alert variant="warning">
                    Company rate data is unavailable. Refresh the dataset to try again.
                  </Alert>
                )}
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="reminders" className="space-y-6">
              <ErrorBoundary>
                <Reminders />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <ErrorBoundary>
                <Settings />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="updater">
              <ErrorBoundary>
                <Updater />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </main>

        <footer className="border-t border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
            <p>
              GSTCalc is not financial advice. Verify calculations with the Australian Taxation
              Office or a registered tax agent.
            </p>
            <p>
              Offline mode caches the last downloaded rate schedule for up to seven days. See the{' '}
              <a
                href="https://github.com/MikeHuntswarm/GstCalc/tree/main/docs/support.md"
                className="underline decoration-slate-400 hover:decoration-slate-700"
              >
                support & privacy notes
              </a>{' '}
              and{' '}
              <a
                href="https://github.com/MikeHuntswarm/GstCalc/tree/main/docs/legal.md"
                className="underline decoration-slate-400 hover:decoration-slate-700"
              >
                legal disclaimer
              </a>
              .
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
