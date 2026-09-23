import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAtoStore } from '@/store/ato';

/**
 * Single presentation policy for ATO rate-data staleness. Consumed by App
 * (full banner stack) and OverviewDashboard (compact badges) so the
 * interpretation of status/stale/error/data-age lives in one module instead
 * of being re-derived per call site.
 */
export function AtoDataStatus({ variant = 'banner' }: { variant?: 'banner' | 'badge' }) {
  const { data, status, error, stale } = useAtoStore();
  const lastUpdated = data?.metadata?.lastUpdated;

  if (variant === 'banner') {
    return (
      <>
        {status === 'loading' ? (
          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            Fetching the latest rates from the ATO...
          </Alert>
        ) : null}
        {error ? <Alert variant="warning">Using cached data. {error}</Alert> : null}
        {stale ? (
          <Alert variant="warning">
            Cached rates may be out of date. Refresh when you are back online to pull the latest
            data from the ATO.
          </Alert>
        ) : null}
        {data && lastUpdated ? <AtoDataAgeAlert lastUpdated={lastUpdated} /> : null}
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Badge variant="outline">
        Status: {status === 'loading' ? 'Loading' : status === 'error' ? 'Using cache' : 'Ready'}
      </Badge>
      {stale ? <Badge variant="warning">Cached data may be out of date</Badge> : null}
      {error ? <span className="text-danger-foreground text-xs">{String(error)}</span> : null}
    </div>
  );
}

/** Destructive alert when the cached ATO data is older than 7 days. */
function AtoDataAgeAlert({ lastUpdated }: { lastUpdated: string }) {
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSinceUpdate <= 7) return null;

  return (
    <Alert variant="destructive">
      ATO rate data is {daysSinceUpdate} days old. Tax brackets, penalty units, and interest rates
      may have changed since {new Date(lastUpdated).toLocaleDateString('en-AU')}. Click the Refresh
      rates button above to pull the latest data.
    </Alert>
  );
}
