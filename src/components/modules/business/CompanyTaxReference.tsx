import { Building2Icon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { formatPercent } from '@/lib/utils';
import type { CompanyRate } from '@/types/ato';

interface CompanyTaxReferenceProps {
  baseRate: CompanyRate;
  fullRate: CompanyRate;
}

export function CompanyTaxReference({ baseRate, fullRate }: CompanyTaxReferenceProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Building2Icon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-2xl">Company tax quick reference</CardTitle>
            <CardDescription>
              Understand the company tax rate that applies based on your turnover and passive income
              mix.
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
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
              Full company rate
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {formatPercent(fullRate.rate)}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{fullRate.criteria}</p>
          </div>
        </div>
        <Alert>
          Companies that qualify for the base rate entity concessions must also apply the lower
          company tax rate when franking distributions.
        </Alert>
      </CardContent>
    </Card>
  );
}
