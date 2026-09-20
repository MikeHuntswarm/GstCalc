import { CalendarCheckIcon, BellIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BasQuarter } from '@/types/ato';

interface BasScheduleProps {
  basQuarters: BasQuarter[];
  /** Labels of quarters that currently have a reminder set. */
  reminderLabels: string[];
  onToggleReminder: (quarter: BasQuarter) => void;
}

export function BasSchedule({ basQuarters, reminderLabels, onToggleReminder }: BasScheduleProps) {
  const hasReminder = (label: string) => reminderLabels.includes(label);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <CalendarCheckIcon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-2xl">BAS schedule &amp; reminders</CardTitle>
            <CardDescription>
              Track standard BAS quarters and quickly toggle reminders for each due date.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {basQuarters.map((quarter) => {
            const active = hasReminder(quarter.label);
            return (
              <div
                key={quarter.label}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {quarter.label}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Standard due date {quarter.standardDueDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {active ? (
                    <Badge className="bg-amber-100 text-amber-800">Reminder on</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-700">No reminder</Badge>
                  )}
                  <Button
                    type="button"
                    variant={active ? 'outline' : 'default'}
                    size="sm"
                    className="gap-1"
                    onClick={() => onToggleReminder(quarter)}
                  >
                    <BellIcon className="h-4 w-4" />
                    {active ? 'Remove' : 'Track'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
