import { useState } from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { estimateFailureToLodgePenalty } from '@/lib/calculations/penalties';
import type { PenaltySchedule } from '@/types/ato';

interface PenaltyAwarenessProps {
  penalties: PenaltySchedule;
}

export function PenaltyAwareness({ penalties }: PenaltyAwarenessProps) {
  const [daysLate, setDaysLate] = useState('');

  const parsedDaysLate = Math.max(0, parseInt(daysLate || '0', 10) || 0);
  const ftlEstimate = estimateFailureToLodgePenalty(parsedDaysLate, penalties.failureToLodge);

  return (
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 md:col-span-3 dark:border-red-800 dark:bg-red-950">
            <p className="text-xs uppercase text-red-700 dark:text-red-300">
              Failure to Lodge penalty estimate
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-sm text-red-800 dark:text-red-400">Penalty units</p>
                <p className="text-2xl font-semibold text-red-900 dark:text-red-200">
                  {ftlEstimate.penaltyUnits}
                </p>
              </div>
              <div>
                <p className="text-sm text-red-800 dark:text-red-400">Dollar impact</p>
                <p className="text-2xl font-semibold text-red-900 dark:text-red-200">
                  {formatCurrency(ftlEstimate.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-red-800 dark:text-red-400">28-day periods late</p>
                <p className="text-2xl font-semibold text-red-900 dark:text-red-200">
                  {ftlEstimate.periodsLate}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-red-800 dark:text-red-400">
              {penalties.failureToLodge.description}
            </p>
            <p className="mt-2 text-xs text-red-700 dark:text-red-400">
              Penalty unit value: {formatCurrency(penalties.failureToLodge.unitValue)}. Capped at{' '}
              {` ${penalties.failureToLodge.maxUnits} `}units for small entities. This is an
              estimate only — the ATO may remit or adjust penalties based on your lodgement history
              and any remission requests.
            </p>
          </div>
        </div>
        <Alert variant="warning">
          {penalties.generalInterestCharge.description} Plan for cash flow ahead of time or contact
          the ATO to negotiate a payment arrangement.
        </Alert>
      </CardContent>
    </Card>
  );
}
