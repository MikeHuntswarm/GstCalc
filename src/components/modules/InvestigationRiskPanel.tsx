import { useState } from 'react';
import { AlertTriangleIcon, ShieldAlertIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RiskAssessment, RiskSeverity } from '@/lib/calculations/atoInvestigationRisk';

interface InvestigationRiskPanelProps {
  riskAssessment: RiskAssessment;
  compact?: boolean;
}

const SEVERITY_COLORS: Record<
  RiskSeverity,
  { bg: string; border: string; text: string; badge: string }
> = {
  none: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-900 dark:text-green-100',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  low: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-900 dark:text-yellow-100',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-900 dark:text-orange-100',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
};

export function InvestigationRiskPanel({
  riskAssessment,
  compact = false,
}: InvestigationRiskPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const colors = SEVERITY_COLORS[riskAssessment.overallRisk];

  if (compact) {
    return (
      <div className={`rounded-lg border p-4 ${colors.border} ${colors.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlertIcon className="h-5 w-5" />
            <div>
              <p className={`font-semibold ${colors.text}`}>
                Investigation Risk: {riskAssessment.overallRisk.toUpperCase()}
              </p>
              <p className={`text-sm ${colors.text}`}>Risk Score: {riskAssessment.riskScore}/100</p>
            </div>
          </div>
          <Badge className={colors.badge}>{riskAssessment.flags.length} Flags</Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-2 ${colors.border}`}>
      <CardHeader className={colors.bg}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/50 dark:bg-slate-900/50">
              <ShieldAlertIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className={`text-2xl ${colors.text}`}>
                ATO Investigation Risk Analysis
              </CardTitle>
              <CardDescription className={colors.text}>
                Based on lodgement history patterns and compliance indicators
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* Overall Risk */}
        <div className={`rounded-lg border p-4 ${colors.border} ${colors.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Overall Risk Level
              </p>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {riskAssessment.overallRisk.toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Risk Score</p>
              <p className={`text-3xl font-bold ${colors.text}`}>{riskAssessment.riskScore}/100</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">{riskAssessment.summary}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Last analyzed: {new Date(riskAssessment.lastAnalyzed).toLocaleString('en-AU')}
          </p>
        </div>

        {/* Flags */}
        {riskAssessment.flags.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Risk Flags ({riskAssessment.flags.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                {expanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Expand All
                  </>
                )}
              </Button>
            </div>

            {riskAssessment.flags.map((flag, index) => {
              const flagColors = SEVERITY_COLORS[flag.severity];
              return (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${flagColors.border} ${flagColors.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={flagColors.badge}>{flag.severity.toUpperCase()}</Badge>
                        <AlertTriangleIcon className="h-4 w-4" />
                        <span className={`font-semibold ${flagColors.text}`}>{flag.message}</span>
                      </div>

                      {expanded && (
                        <>
                          <p className={`text-sm ${flagColors.text}`}>
                            <strong>Recommendation:</strong> {flag.recommendation}
                          </p>

                          {flag.affectedPeriods.length > 0 && (
                            <div>
                              <p className={`text-xs font-medium ${flagColors.text}`}>
                                Affected Periods:
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {flag.affectedPeriods.slice(0, 3).map((period, i) => (
                                  <span
                                    key={i}
                                    className={`rounded px-2 py-0.5 text-xs ${flagColors.badge}`}
                                  >
                                    {period}
                                  </span>
                                ))}
                                {flag.affectedPeriods.length > 3 && (
                                  <span
                                    className={`rounded px-2 py-0.5 text-xs ${flagColors.badge}`}
                                  >
                                    +{flag.affectedPeriods.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {flag.details && (
                            <div className="flex gap-4 text-xs">
                              {flag.details.count !== undefined && (
                                <span className={flagColors.text}>Count: {flag.details.count}</span>
                              )}
                              {flag.details.metric !== undefined && (
                                <span className={flagColors.text}>
                                  Metric: {flag.details.metric.toFixed(0)}
                                </span>
                              )}
                              {flag.details.threshold !== undefined && (
                                <span className={flagColors.text}>
                                  Threshold: {flag.details.threshold.toFixed(0)}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recommendations */}
        {riskAssessment.recommendations.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Key Recommendations
            </h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {riskAssessment.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {riskAssessment.flags.length === 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950">
            <p className="font-semibold text-green-900 dark:text-green-100">
              No compliance issues detected
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your lodgement history shows good compliance. Keep up the timely lodgements!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
