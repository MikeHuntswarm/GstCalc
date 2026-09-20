import { PackageCheckIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { InstantAssetWriteOff, SimplifiedDepreciationPool } from '@/types/ato';

interface SmallBusinessConcessionsProps {
  instantAsset?: InstantAssetWriteOff;
  depreciationPool?: SimplifiedDepreciationPool;
  reminder?: string;
}

export function SmallBusinessConcessions({
  instantAsset,
  depreciationPool,
  reminder,
}: SmallBusinessConcessionsProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <PackageCheckIcon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-2xl">Instant asset write-off &amp; pooling</CardTitle>
            <CardDescription>
              Check eligibility for the temporary instant asset write-off and simplified
              depreciation pool.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        {instantAsset ? (
          <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
            <p className="text-xs uppercase text-emerald-700 dark:text-emerald-300">
              Instant asset write-off
            </p>
            <p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
              {formatCurrency(instantAsset.threshold)}
            </p>
            <p className="text-xs text-emerald-800 dark:text-emerald-400">
              {instantAsset.effectivePeriod}
            </p>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-200">
              {instantAsset.eligibility}
            </p>
            {instantAsset.notes ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{instantAsset.notes}</p>
            ) : null}
          </div>
        ) : null}

        {depreciationPool ? (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
              Simplified depreciation pool
            </p>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <p>
                Pool balance threshold:{' '}
                <span className="font-semibold">{formatCurrency(depreciationPool.threshold)}</span>
              </p>
              <p className="mt-2">
                First year rate:{' '}
                <span className="font-semibold">
                  {formatPercent(depreciationPool.firstYearRate)}
                </span>
              </p>
              <p>
                Subsequent years:{' '}
                <span className="font-semibold">
                  {formatPercent(depreciationPool.subsequentRate)}
                </span>
              </p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {depreciationPool.eligibility}
            </p>
            {depreciationPool.notes ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{depreciationPool.notes}</p>
            ) : null}
          </div>
        ) : null}

        {reminder ? (
          <Alert className="md:col-span-2">
            <p className="text-sm text-slate-700 dark:text-slate-300">{reminder}</p>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
