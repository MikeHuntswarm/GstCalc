import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { COMPANY_TAX_FULL_RATE, COMPANY_TAX_BASE_RATE } from '@/lib/constants';

interface FrankingResult {
  dividendReceived: number;
  frankingCredit: number;
  grossedUpDividend: number;
  taxOnDividend: number;
  netBenefit: number;
  effectiveTaxRate: number;
  refundDue: number;
}

export function FrankingCredits() {
  const [dividendAmount, setDividendAmount] = useState('');
  const [frankingPercentage, setFrankingPercentage] = useState('100');
  const [marginalTaxRate, setMarginalTaxRate] = useState('');
  const [companyTaxRate, setCompanyTaxRate] = useState(String(COMPANY_TAX_FULL_RATE * 100));

  const calculateFranking = (): FrankingResult | null => {
    const dividend = parseFloat(dividendAmount);
    const franking = parseFloat(frankingPercentage) / 100;
    const marginalRate = parseFloat(marginalTaxRate) / 100;
    const companyRate = parseFloat(companyTaxRate) / 100;

    if (isNaN(dividend) || isNaN(franking) || isNaN(marginalRate) || isNaN(companyRate)) {
      return null;
    }

    // Franking credit = (dividend / (1 - company tax rate)) - dividend
    // Or simplified: dividend * (company tax rate / (1 - company tax rate))
    const frankingCredit = (dividend / (1 - companyRate) - dividend) * franking;

    // Grossed-up dividend = dividend + franking credit
    const grossedUpDividend = dividend + frankingCredit;

    // Tax on grossed-up dividend at marginal rate
    const taxOnDividend = grossedUpDividend * marginalRate;

    // Net benefit = franking credit - tax on dividend
    // If negative, you owe tax; if positive, you get a refund
    const netBenefit = frankingCredit - taxOnDividend;

    // Refund is the positive net benefit (if any)
    const refundDue = Math.max(0, netBenefit);

    // Effective tax rate on dividend
    const effectiveTaxRate =
      grossedUpDividend > 0 ? (taxOnDividend - frankingCredit) / grossedUpDividend : 0;

    return {
      dividendReceived: dividend,
      frankingCredit,
      grossedUpDividend,
      taxOnDividend,
      netBenefit,
      effectiveTaxRate,
      refundDue,
    };
  };

  const result = calculateFranking();

  const handleCopy = () => {
    if (!result) return;

    const text = `Franking Credit Calculation
Dividend Received: ${formatCurrency(result.dividendReceived)}
Franking Credit: ${formatCurrency(result.frankingCredit)}
Grossed-Up Dividend: ${formatCurrency(result.grossedUpDividend)}
Tax on Dividend: ${formatCurrency(result.taxOnDividend)}
Net Benefit: ${formatCurrency(result.netBenefit)}
${result.refundDue > 0 ? `Refund Due: ${formatCurrency(result.refundDue)}` : ''}
Effective Tax Rate: ${formatPercent(result.effectiveTaxRate)}`;

    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Franking Credit Calculator</CardTitle>
        <CardDescription>
          Calculate franking credits and tax refunds on fully or partially franked Australian
          dividends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="dividend-amount">Dividend Amount</Label>
              <Input
                id="dividend-amount"
                type="number"
                placeholder="10000"
                value={dividendAmount}
                onChange={(e) => setDividendAmount(e.target.value)}
                min="0"
                step="0.01"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Cash dividend you received
              </p>
            </div>

            <div>
              <Label htmlFor="franking-percentage">Franking Percentage</Label>
              <Input
                id="franking-percentage"
                type="number"
                placeholder="100"
                value={frankingPercentage}
                onChange={(e) => setFrankingPercentage(e.target.value)}
                min="0"
                max="100"
                step="1"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                100% = fully franked, 0% = unfranked
              </p>
            </div>

            <div>
              <Label htmlFor="marginal-tax-rate">Your Marginal Tax Rate (%)</Label>
              <Input
                id="marginal-tax-rate"
                type="number"
                placeholder="32.5"
                value={marginalTaxRate}
                onChange={(e) => setMarginalTaxRate(e.target.value)}
                min="0"
                max="100"
                step="0.5"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Your personal tax rate (incl. Medicare levy)
              </p>
            </div>

            <div>
              <Label htmlFor="company-tax-rate">Company Tax Rate (%)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCompanyTaxRate(String(COMPANY_TAX_BASE_RATE * 100))}
                  className={
                    companyTaxRate === String(COMPANY_TAX_BASE_RATE * 100) ? 'bg-blue-50' : ''
                  }
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCompanyTaxRate(String(COMPANY_TAX_FULL_RATE * 100))}
                  className={
                    companyTaxRate === String(COMPANY_TAX_FULL_RATE * 100) ? 'bg-blue-50' : ''
                  }
                >
                  30%
                </Button>
              </div>
              <Input
                id="company-tax-rate"
                type="number"
                placeholder="30"
                value={companyTaxRate}
                onChange={(e) => setCompanyTaxRate(e.target.value)}
                min="0"
                max="100"
                step="0.5"
                className="mt-2"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Tax rate paid by the company
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {result ? (
              <>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Cash Dividend
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(result.dividendReceived)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Franking Credit
                      </span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(result.frankingCredit)}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Grossed-Up Dividend</span>
                      <span className="font-semibold">
                        {formatCurrency(result.grossedUpDividend)}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Tax @ {formatPercent(parseFloat(marginalTaxRate) / 100)}
                      </span>
                      <span className="text-sm text-red-600 dark:text-red-400">
                        -{formatCurrency(result.taxOnDividend)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Less: Franking Credit
                      </span>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">
                        -{formatCurrency(result.frankingCredit)}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Net Tax Position</span>
                      <span
                        className={`font-bold ${result.netBenefit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {result.netBenefit >= 0 ? '+' : ''}
                        {formatCurrency(result.netBenefit)}
                      </span>
                    </div>

                    {result.refundDue > 0 && (
                      <div className="mt-4 rounded-md bg-emerald-50 p-3 dark:bg-emerald-900/20">
                        <div className="flex items-center justify-between">
                          <Badge variant="default" className="bg-emerald-600">
                            Refund Due
                          </Badge>
                          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(result.refundDue)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                      <p>
                        <strong>Effective tax rate:</strong>{' '}
                        {formatPercent(result.effectiveTaxRate)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleCopy} variant="outline" className="w-full">
                  Copy Summary
                </Button>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="font-semibold text-blue-900 dark:text-blue-300">How it works:</p>
                  <ul className="mt-2 space-y-1 text-xs text-blue-800 dark:text-blue-400">
                    <li>• Franking credits represent tax already paid by the company</li>
                    <li>• Credits offset your personal tax on the dividend</li>
                    <li>• Excess credits may be refunded if your tax rate is lower</li>
                    <li>
                      • {parseFloat(frankingPercentage)}% franking means{' '}
                      {parseFloat(frankingPercentage)}% of the maximum credit applies
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter dividend details to calculate franking credits
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
