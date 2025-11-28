import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { CalendarCheckIcon, LineChartIcon } from 'lucide-react';
import { useAtoStore } from '@/store/ato';
import { useRemindersStore } from '@/store/reminders';
import { formatPercent } from '@/lib/utils';

export function OverviewDashboard() {
  const { data, status, error, stale } = useAtoStore();
  const { getUpcomingReminders } = useRemindersStore();

  const gstRate = data?.gst.standardRate ?? 0.1;
  const lastUpdated = data?.metadata.lastUpdated;
  const baseRate = data?.company?.baseRateEntity;
  const fullRate = data?.company?.fullRate;
  const upcomingReminders = getUpcomingReminders(30);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LineChartIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">ATO data snapshot</CardTitle>
              <CardDescription>
                Current GST rate and data freshness based on the latest ATO dataset.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline gap-2">
            <p className="text-sm text-slate-600">Standard GST rate</p>
            <p className="text-2xl font-semibold text-slate-900">{formatPercent(gstRate)}</p>
          </div>
          <p className="text-xs text-slate-500">
            Last updated{' '}
            {lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-AU') : 'Pending sync'}.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">
              Status: {status === 'loading' ? 'Loading' : status === 'error' ? 'Using cache' : 'Ready'}
            </Badge>
            {stale ? <Badge variant="warning">Cached data may be out of date</Badge> : null}
            {error ? <span className="text-danger-foreground text-xs">{String(error)}</span> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning-foreground">
              <CalendarCheckIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">Upcoming deadlines</CardTitle>
              <CardDescription>
                A quick view of the next BAS, tax, or superannuation reminders.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingReminders.length === 0 ? (
            <Alert>
              No upcoming reminders in the next 30 days. Add lodgement reminders from the Reminders tab.
            </Alert>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between gap-3 rounded-lg border border-muted bg-white px-3 py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge>{reminder.category}</Badge>
                      <span className="text-sm font-medium text-slate-900">{reminder.label}</span>
                    </div>
                    <p className="text-xs text-slate-600">Due {reminder.dueDate}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">Linked reminder</span>
                </div>
              ))}
              {upcomingReminders.length > 3 ? (
                <p className="text-xs text-slate-500">
                  +{upcomingReminders.length - 3} more upcoming deadlines in the Reminders tab.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <LineChartIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">Company tax snapshot</CardTitle>
              <CardDescription>
                Quick reference for base rate entity vs full company rate.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!baseRate || !fullRate ? (
            <Alert>
              Company tax data is unavailable. Refresh ATO data from the header to load rates, then
              see full details in the Business tools tab.
            </Alert>
          ) : (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs uppercase text-primary">Base rate entity</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatPercent(baseRate.rate)}
                </p>
                <p className="mt-1 text-xs text-slate-700">{baseRate.criteria}</p>
              </div>
              <div className="rounded-lg border border-muted bg-white p-3">
                <p className="text-xs uppercase text-slate-500">Full company rate</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatPercent(fullRate.rate)}
                </p>
                <p className="mt-1 text-xs text-slate-700">{fullRate.criteria}</p>
              </div>
              <p className="text-xs text-slate-500">
                For detailed planning tools, open the Business tools tab to estimate BAS and penalty
                exposure.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
