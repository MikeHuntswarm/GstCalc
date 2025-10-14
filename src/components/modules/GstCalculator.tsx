import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalculatorIcon, CopyIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { determineGstFromAmount } from '@/lib/calculations/gst';

interface GstCalculatorProps {
  defaultRate: number;
  notes?: string;
}

type Mode = 'exclusive' | 'inclusive';

type CopyTarget = 'exclusive' | 'gst' | 'inclusive' | null;

export function GstCalculator({ defaultRate, notes }: GstCalculatorProps) {
  const [mode, setMode] = useState<Mode>('exclusive');
  const [amountInput, setAmountInput] = useState('');
  const [rateInput, setRateInput] = useState((defaultRate * 100).toFixed(2));
  const [rateDirty, setRateDirty] = useState(false);
  const [copyTarget, setCopyTarget] = useState<CopyTarget>(null);

  useEffect(() => {
    if (!rateDirty) {
      const nextRate = (defaultRate * 100).toFixed(2);
      setRateInput((current) => (current !== nextRate ? nextRate : current));
    }
  }, [defaultRate, rateDirty]);

  const amount = useMemo(() => {
    const value = parseFloat(amountInput.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(value) ? value : 0;
  }, [amountInput]);

  const rate = useMemo(() => {
    const value = parseFloat(rateInput);
    const decimal = Number.isFinite(value) ? value / 100 : defaultRate;
    return decimal > 0 ? decimal : defaultRate;
  }, [defaultRate, rateInput]);

  const result = useMemo(() => determineGstFromAmount(amount, rate, mode), [amount, rate, mode]);

  const handleQuickAmount = useCallback(
    (value: number) => {
      setAmountInput(value.toFixed(2));
    },
    [setAmountInput],
  );

  const handleCopy = useCallback(async (target: Exclude<CopyTarget, null>, value: number) => {
    try {
      await navigator.clipboard.writeText(value.toFixed(2));
      setCopyTarget(target);
      setTimeout(() => setCopyTarget(null), 2000);
    } catch (error) {
      console.error('Clipboard copy failed', error);
    }
  }, []);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <CalculatorIcon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-2xl">GST Calculator</CardTitle>
            <CardDescription>
              Work with ex-GST or inc-GST amounts, adjust the GST rate, and copy results instantly.
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>Standard rate:</span>
          <Badge>{formatPercent(defaultRate)}</Badge>
          {notes ? <span className="text-xs text-slate-500">{notes}</span> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
          <TabsList>
            <TabsTrigger value="exclusive">Enter Ex-GST</TabsTrigger>
            <TabsTrigger value="inclusive">Enter Inc-GST</TabsTrigger>
          </TabsList>
          <TabsContent value="exclusive" className="mt-6">
            <p className="text-sm text-slate-600">
              Provide an amount before GST. We will calculate the GST component and the total
              payable including GST.
            </p>
          </TabsContent>
          <TabsContent value="inclusive" className="mt-6">
            <p className="text-sm text-slate-600">
              Provide an amount that already includes GST. We will break down the GST component and
              the ex-GST value.
            </p>
          </TabsContent>
        </Tabs>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                inputMode="decimal"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                placeholder={mode === 'exclusive' ? 'Enter ex-GST amount' : 'Enter inc-GST amount'}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => handleQuickAmount(100)}>
                + $100
              </Button>
              <Button type="button" variant="outline" onClick={() => handleQuickAmount(1000)}>
                + $1,000
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAmountInput('')}>
                Clear
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">GST rate (%)</Label>
            <Input
              id="rate"
              inputMode="decimal"
              value={rateInput}
              onChange={(event) => {
                setRateDirty(true);
                setRateInput(event.target.value);
              }}
              placeholder={(defaultRate * 100).toFixed(2)}
            />
            <p className="text-xs text-slate-500">
              Override the default GST rate to explore other scenarios (for example for wine
              equalisation or luxury car tax adjustments).
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs uppercase text-slate-500">Ex-GST amount</p>
            <p className="text-2xl font-semibold text-slate-900">
              {formatCurrency(result.exclusive)}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-fit px-2 text-xs"
              onClick={() => handleCopy('exclusive', result.exclusive)}
            >
              <CopyIcon className="mr-1 h-3.5 w-3.5" />
              {copyTarget === 'exclusive' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-slate-500">GST component</p>
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(result.gst)}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-fit px-2 text-xs"
              onClick={() => handleCopy('gst', result.gst)}
            >
              <CopyIcon className="mr-1 h-3.5 w-3.5" />
              {copyTarget === 'gst' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-slate-500">Inc-GST total</p>
            <p className="text-2xl font-semibold text-slate-900">
              {formatCurrency(result.inclusive)}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-fit px-2 text-xs"
              onClick={() => handleCopy('inclusive', result.inclusive)}
            >
              <CopyIcon className="mr-1 h-3.5 w-3.5" />
              {copyTarget === 'inclusive' ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <Alert variant="warning">
          Lodging your BAS late can attract Failure to Lodge penalties and General Interest Charge.
          Use the penalty estimator in the business tools tab to understand potential costs of
          missing a deadline.
        </Alert>
      </CardContent>
    </Card>
  );
}
