import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { SUPER_GUARANTEE_RATE } from '@/lib/constants';

interface SuperResult {
  annualSalary: number;
  superGuarantee: number;
  salarySacrifice: number;
  totalContributions: number;
  totalPackage: number;
  concessionalCap: number;
  nonConcessionalCap: number;
  concessionalRemaining: number;
  taxSavingsEstimate: number;
}

export function SuperCalculator() {
  const [salary, setSalary] = useState('');
  const [salarySacrifice, setSalarySacrifice] = useState('');
  const [existingSuper, setExistingSuper] = useState('');
  const [marginalTaxRate, setMarginalTaxRate] = useState('');

  const currentYear = new Date().getFullYear();
  const CONCESSIONAL_CAP = 30000; // 2024-25 cap
  const NON_CONCESSIONAL_CAP = 120000; // 2024-25 cap

  const calculateSuper = (): SuperResult | null => {
    const annualSalary = parseFloat(salary);
    const sacrifice = parseFloat(salarySacrifice) || 0;
    const existing = parseFloat(existingSuper) || 0;
    const taxRate = parseFloat(marginalTaxRate) / 100;

    if (isNaN(annualSalary) || isNaN(taxRate)) {
      return null;
    }

    // Super Guarantee (11.5% as of July 2024)
    const superGuarantee = annualSalary * SUPER_GUARANTEE_RATE;

    // Total concessional contributions
    const totalContributions = superGuarantee + sacrifice;

    // Total package
    const totalPackage = annualSalary + superGuarantee + sacrifice;

    // Remaining caps
    const concessionalRemaining = Math.max(0, CONCESSIONAL_CAP - totalContributions - existing);

    // Tax savings from salary sacrifice
    // Assumes 15% contributions tax vs marginal rate
    const taxSavingsEstimate = sacrifice * (taxRate - 0.15);

    return {
      annualSalary,
      superGuarantee,
      salarySacrifice: sacrifice,
      totalContributions,
      totalPackage,
      concessionalCap: CONCESSIONAL_CAP,
      nonConcessionalCap: NON_CONCESSIONAL_CAP,
      concessionalRemaining,
      taxSavingsEstimate,
    };
  };

  const result = calculateSuper();

  const handleCopy = () => {
    if (!result) return;

    const text = `Superannuation Calculation (${currentYear})
Annual Salary: ${formatCurrency(result.annualSalary)}
Super Guarantee (${formatPercent(SUPER_GUARANTEE_RATE)}): ${formatCurrency(result.superGuarantee)}
Salary Sacrifice: ${formatCurrency(result.salarySacrifice)}
Total Super Contributions: ${formatCurrency(result.totalContributions)}
Total Package: ${formatCurrency(result.totalPackage)}

Concessional Cap: ${formatCurrency(result.concessionalCap)}
Remaining Concessional Capacity: ${formatCurrency(result.concessionalRemaining)}
Estimated Tax Savings from Sacrifice: ${formatCurrency(result.taxSavingsEstimate)}`;

    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const isOverCap = result && result.totalContributions > result.concessionalCap;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Superannuation Calculator</CardTitle>
        <CardDescription>
          Calculate super guarantee, salary sacrifice benefits, and contribution caps for{' '}
          {currentYear}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="salary">Annual Salary (Before Tax)</Label>
              <Input
                id="salary"
                type="number"
                placeholder="100000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                min="0"
                step="1000"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Your base salary excluding super
              </p>
            </div>

            <div>
              <Label htmlFor="salary-sacrifice">Salary Sacrifice Amount (Annual)</Label>
              <Input
                id="salary-sacrifice"
                type="number"
                placeholder="0"
                value={salarySacrifice}
                onChange={(e) => setSalarySacrifice(e.target.value)}
                min="0"
                step="100"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Additional pre-tax contributions to super
              </p>
            </div>

            <div>
              <Label htmlFor="existing-super">Existing Concessional Contributions</Label>
              <Input
                id="existing-super"
                type="number"
                placeholder="0"
                value={existingSuper}
                onChange={(e) => setExistingSuper(e.target.value)}
                min="0"
                step="100"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Other concessional contributions this year (e.g., from previous employer)
              </p>
            </div>

            <div>
              <Label htmlFor="marginal-rate">Your Marginal Tax Rate (%)</Label>
              <Input
                id="marginal-rate"
                type="number"
                placeholder="32.5"
                value={marginalTaxRate}
                onChange={(e) => setMarginalTaxRate(e.target.value)}
                min="0"
                max="100"
                step="0.5"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                For tax savings calculation (incl. Medicare levy)
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
                        Annual Salary
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(result.annualSalary)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Super Guarantee ({formatPercent(SUPER_GUARANTEE_RATE)})
                      </span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(result.superGuarantee)}
                      </span>
                    </div>

                    {result.salarySacrifice > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Salary Sacrifice
                        </span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          +{formatCurrency(result.salarySacrifice)}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total Super Contributions</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(result.totalContributions)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Total Package Value
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(result.totalPackage)}
                      </span>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Concessional Cap</span>
                        <span className="text-sm">{formatCurrency(result.concessionalCap)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Used This Year
                        </span>
                        <span className="text-sm">
                          {formatCurrency(
                            result.totalContributions + parseFloat(existingSuper || '0'),
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Remaining Capacity</span>
                        <span
                          className={`text-sm font-bold ${
                            result.concessionalRemaining > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatCurrency(result.concessionalRemaining)}
                        </span>
                      </div>

                      {isOverCap && (
                        <div className="mt-2 rounded-md bg-red-50 p-2 dark:bg-red-900/20">
                          <Badge variant="warning" className="bg-red-600 text-white text-xs">
                            Over Cap
                          </Badge>
                          <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                            Excess contributions may be taxed at your marginal rate plus interest
                          </p>
                        </div>
                      )}
                    </div>

                    {result.salarySacrifice > 0 && result.taxSavingsEstimate > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="rounded-md bg-emerald-50 p-3 dark:bg-emerald-900/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
                              Est. Tax Savings
                            </span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(result.taxSavingsEstimate)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                            Saving {formatPercent((parseFloat(marginalTaxRate) - 15) / 100)} on
                            sacrificed amount (marginal rate minus 15% contributions tax)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Button onClick={handleCopy} variant="outline" className="w-full">
                  Copy Summary
                </Button>

                <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="font-semibold text-blue-900 dark:text-blue-300">Key Points:</p>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-400">
                    <li>
                      • Concessional cap: {formatCurrency(CONCESSIONAL_CAP)} ({currentYear})
                    </li>
                    <li>
                      • Non-concessional cap: {formatCurrency(NON_CONCESSIONAL_CAP)} (after-tax)
                    </li>
                    <li>• Super guarantee rate: {formatPercent(SUPER_GUARANTEE_RATE)}</li>
                    <li>• Contributions tax: 15% on concessional contributions</li>
                    <li>• Division 293 tax: Additional 15% if income over $250,000</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter your salary details to calculate super contributions
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
