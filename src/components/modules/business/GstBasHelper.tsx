import { useMemo, useState } from 'react';
import { CalendarClockIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { calculateFromInclusive } from '@/lib/calculations/gst';

interface GstBasHelperProps {
  gstRate: number;
}

export function GstBasHelper({ gstRate }: GstBasHelperProps) {
  const [sales, setSales] = useState('');
  const [gstCollected, setGstCollected] = useState('');
  const [gstCredits, setGstCredits] = useState('');

  const parsedSales = useMemo(() => parseFloat(sales.replace(/[^0-9.-]/g, '')) || 0, [sales]);
  const parsedGstCollected = useMemo(
    () => parseFloat(gstCollected.replace(/[^0-9.-]/g, '')) || 0,
    [gstCollected],
  );
  const parsedGstCredits = useMemo(
    () => parseFloat(gstCredits.replace(/[^0-9.-]/g, '')) || 0,
    [gstCredits],
  );

  const netGst = useMemo(
    () => parsedGstCollected - parsedGstCredits,
    [parsedGstCollected, parsedGstCredits],
  );

  const handleAutofill = () => {
    // Sales is treated as GST-inclusive; extract the GST component via the tested function
    const gstComponent = calculateFromInclusive(parsedSales, gstRate).gst;
    setGstCollected(gstComponent.toFixed(2));
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <CalendarClockIcon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-2xl">GST BAS helper</CardTitle>
            <CardDescription>
              Summarise GST collected and credits to estimate your 1A and 1B figures.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="sales">Total sales (G1)</Label>
            <Input
              id="sales"
              inputMode="decimal"
              value={sales}
              placeholder="e.g. 125000"
              onChange={(event) => setSales(event.target.value)}
            />
            <p className="text-xs text-slate-500">
              Include GST in this figure if you report on a GST-inclusive basis - the autofill
              assumes the total is GST inclusive.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gstCollected">GST collected (1A)</Label>
            <Input
              id="gstCollected"
              inputMode="decimal"
              value={gstCollected}
              placeholder="e.g. 12500"
              onChange={(event) => setGstCollected(event.target.value)}
            />
            <p className="text-xs text-slate-500">Total GST on sales and other taxable supplies.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gstCredits">GST credits (1B)</Label>
            <Input
              id="gstCredits"
              inputMode="decimal"
              value={gstCredits}
              placeholder="e.g. 8500"
              onChange={(event) => setGstCredits(event.target.value)}
            />
            <p className="text-xs text-slate-500">
              Include all input tax credits you are entitled to claim.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div>
            <p className="text-xs uppercase text-amber-700 dark:text-amber-300">
              Net GST payable / refund
            </p>
            <p className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
              {formatCurrency(netGst)}
            </p>
          </div>
          <Badge variant={netGst >= 0 ? 'warning' : 'outline'}>
            {netGst >= 0 ? 'Payable (1A - 1B)' : 'Refund due'}
          </Badge>
          <Button type="button" variant="ghost" size="sm" onClick={handleAutofill}>
            Autofill GST on sales ({formatPercent(gstRate)})
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          These BAS figures are indicative only and based on the inputs you provide. Always confirm
          1A/1B labels and amounts in your actual BAS form and lodged records.
        </p>
      </CardContent>
    </Card>
  );
}
