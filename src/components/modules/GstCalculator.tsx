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
import { useAtoStore } from '@/store/ato';

type Mode = 'exclusive' | 'inclusive';

type CopyTarget = 'exclusive' | 'gst' | 'inclusive' | 'summary' | null;

type SavedScenario = {
  id: string;
  label: string;
  mode: Mode;
  amountInput: string;
  rateInput: string;
};

export function GstCalculator() {
  const { data: atoData } = useAtoStore();
  const defaultRate = atoData?.gst.standardRate ?? 0.1;
  const notes = atoData?.gst.notes;

  const [mode, setMode] = useState<Mode>('exclusive');
  const [amountInput, setAmountInput] = useState('');
  const [rateInput, setRateInput] = useState((defaultRate * 100).toFixed(2));
  const [rateDirty, setRateDirty] = useState(false);
  const [copyTarget, setCopyTarget] = useState<CopyTarget>(null);

  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [, setSelectedScenarioId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('gstcalc:scenarios');
      if (raw) {
        const parsed = JSON.parse(raw) as SavedScenario[];
        if (Array.isArray(parsed)) {
          setScenarios(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load GST scenarios from storage', error);
    }
  }, []);

  useEffect(() => {
    if (!rateDirty) {
      const nextRate = (defaultRate * 100).toFixed(2);
      setRateInput((current) => (current !== nextRate ? nextRate : current));
    }
  }, [defaultRate, rateDirty]);

  useEffect(() => {
    try {
      window.localStorage.setItem('gstcalc:scenarios', JSON.stringify(scenarios));
    } catch (error) {
      console.error('Failed to persist GST scenarios to storage', error);
    }
  }, [scenarios]);

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

  const handleSaveScenario = useCallback(() => {
    if (!amountInput.trim()) {
      return;
    }

    const effectiveRate = rateInput || (defaultRate * 100).toFixed(2);
    const label =
      mode === 'exclusive'
        ? `Ex-GST ${amountInput || 'amount'} @ ${effectiveRate}%`
        : `Inc-GST ${amountInput || 'amount'} @ ${effectiveRate}%`;

    const next: SavedScenario = {
      id: String(Date.now()),
      label,
      mode,
      amountInput,
      rateInput,
    };

    setScenarios((current) => [next, ...current].slice(0, 10));
    setSelectedScenarioId(next.id);
  }, [amountInput, defaultRate, mode, rateInput]);

  const handleApplyScenario = useCallback(
    (id: string) => {
      const scenario = scenarios.find((item) => item.id === id);
      if (!scenario) return;

      setMode(scenario.mode);
      setAmountInput(scenario.amountInput);
      setRateDirty(true);
      setRateInput(scenario.rateInput);
      setSelectedScenarioId(scenario.id);
    },
    [scenarios],
  );

  const handleDeleteScenario = useCallback((id: string) => {
    setScenarios((current) => current.filter((item) => item.id !== id));
    setSelectedScenarioId((current) => (current === id ? null : current));
  }, []);

  const handleCopy = useCallback(async (target: Exclude<CopyTarget, null>, value: number) => {
    try {
      await navigator.clipboard.writeText(value.toFixed(2));
      setCopyTarget(target);
      setTimeout(() => setCopyTarget(null), 2000);
    } catch (error) {
      console.error('Clipboard copy failed', error);
    }
  }, []);

  const handleCopySummary = useCallback(async () => {
    try {
      const summary = [
        `GST summary`,
        mode === 'exclusive' ? 'Input: ex-GST amount' : 'Input: inc-GST amount',
        `Value: ${amountInput || '0'}`,
        `Rate: ${(rate * 100).toFixed(2)}%`,
        `Ex-GST: ${result.exclusive.toFixed(2)}`,
        `GST: ${result.gst.toFixed(2)}`,
        `Inc-GST: ${result.inclusive.toFixed(2)}`,
      ].join(' | ');

      await navigator.clipboard.writeText(summary);
      setCopyTarget('summary');
      setTimeout(() => setCopyTarget(null), 2000);
    } catch (error) {
      console.error('Summary copy failed', error);
    }
  }, [amountInput, mode, rate, result.exclusive, result.gst, result.inclusive]);

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

        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Saved scenarios</p>
            <Button type="button" variant="outline" size="sm" onClick={handleSaveScenario}>
              Save current
            </Button>
          </div>
          {scenarios.length === 0 ? (
            <p className="text-xs text-slate-500">
              Save frequently used GST calculations to reuse them later.
            </p>
          ) : (
            <div className="space-y-2">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                >
                  <button
                    type="button"
                    className="flex flex-1 flex-col items-start text-left text-slate-700 hover:text-slate-900"
                    onClick={() => handleApplyScenario(scenario.id)}
                  >
                    <span className="font-medium">{scenario.label}</span>
                    <span className="text-[11px] text-slate-500">
                      {scenario.mode === 'exclusive' ? 'Ex-GST' : 'Inc-GST'} · Amount{' '}
                      {scenario.amountInput || '0'} · Rate{' '}
                      {scenario.rateInput || (defaultRate * 100).toFixed(2)}%
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-slate-900"
                    onClick={() => handleDeleteScenario(scenario.id)}
                    aria-label="Delete saved scenario"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={handleCopySummary}
        >
          <CopyIcon className="mr-1 h-3.5 w-3.5" />
          {copyTarget === 'summary' ? 'Summary copied' : 'Copy summary'}
        </Button>

        <Alert variant="warning">
          Lodging your BAS late can attract Failure to Lodge penalties and General Interest Charge.
          Use the penalty estimator in the business tools tab to understand potential costs of
          missing a deadline.
        </Alert>
      </CardContent>
    </Card>
  );
}
