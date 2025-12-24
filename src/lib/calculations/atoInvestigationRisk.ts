import type { LodgementRecord } from '@/types/lodgement';
import type { PenaltySchedule } from '@/types/ato';
import { estimateFailureToLodgePenalty } from './penalties';

export type RiskSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type RiskFlagType =
  | 'consecutive-late'
  | 'missing-quarters'
  | 'large-variations'
  | 'nil-then-large'
  | 'excessive-delays'
  | 'round-numbers'
  | 'decreasing-compliance'
  | 'high-penalty-exposure'
  | 'chronic-non-compliance';

export interface RiskFlag {
  type: RiskFlagType;
  severity: RiskSeverity;
  message: string;
  affectedPeriods: string[];
  recommendation: string;
  details?: {
    metric?: number;
    threshold?: number;
    count?: number;
  };
}

export interface RiskAssessment {
  overallRisk: RiskSeverity;
  riskScore: number; // 0-100
  flags: RiskFlag[];
  recommendations: string[];
  summary: string;
  lastAnalyzed: string;
}

const SEVERITY_WEIGHTS: Record<RiskSeverity, number> = {
  none: 0,
  low: 10,
  medium: 25,
  high: 50,
  critical: 100,
};

function formatPeriodKey(record: LodgementRecord): string {
  return record.type === 'gst-bas'
    ? `${record.type} ${record.year} ${record.quarter}`
    : `${record.type} ${record.year}`;
}

function getDaysLate(record: LodgementRecord): number {
  const dueDate = new Date(record.dueDate);
  const compareDate =
    record.status === 'lodged' && record.lodgementDate
      ? new Date(record.lodgementDate)
      : new Date();

  const diffMs = compareDate.getTime() - dueDate.getTime();
  return diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
}

// Detector 1: Consecutive late lodgements
function detectConsecutiveLate(records: LodgementRecord[]): RiskFlag | null {
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  let consecutiveCount = 0;
  let maxConsecutive = 0;
  const affectedPeriods: string[] = [];

  for (const record of sortedRecords) {
    const daysLate = getDaysLate(record);
    if (daysLate > 0) {
      consecutiveCount++;
      affectedPeriods.push(formatPeriodKey(record));
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    } else {
      consecutiveCount = 0;
    }
  }

  if (maxConsecutive >= 5) {
    return {
      type: 'consecutive-late',
      severity: 'critical',
      message: `${maxConsecutive} consecutive late lodgements detected`,
      affectedPeriods: affectedPeriods.slice(-maxConsecutive),
      recommendation:
        'Critical compliance issue. Contact the ATO immediately to discuss a payment plan and lodgement schedule.',
      details: { count: maxConsecutive, threshold: 5 },
    };
  }

  if (maxConsecutive >= 3) {
    return {
      type: 'consecutive-late',
      severity: 'high',
      message: `${maxConsecutive} consecutive late lodgements detected`,
      affectedPeriods: affectedPeriods.slice(-maxConsecutive),
      recommendation:
        'Establish a regular lodgement routine or engage a tax agent to manage compliance.',
      details: { count: maxConsecutive, threshold: 3 },
    };
  }

  return null;
}

// Detector 2: Missing quarters (gaps in sequence)
function detectMissingQuarters(records: LodgementRecord[]): RiskFlag | null {
  const basRecords = records
    .filter((r) => r.type === 'gst-bas')
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const qOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
      return qOrder[a.quarter!] - qOrder[b.quarter!];
    });

  if (basRecords.length < 2) return null;

  const gaps: string[] = [];
  for (let i = 1; i < basRecords.length; i++) {
    const prev = basRecords[i - 1];
    const curr = basRecords[i];

    const qOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
    const prevQ = qOrder[prev.quarter!];
    const currQ = qOrder[curr.quarter!];

    let expectedNext: number;
    let expectedYear: number;

    if (prevQ === 4) {
      expectedNext = 1;
      expectedYear = prev.year + 1;
    } else {
      expectedNext = prevQ + 1;
      expectedYear = prev.year;
    }

    if (curr.year !== expectedYear || currQ !== expectedNext) {
      gaps.push(`Missing period between ${formatPeriodKey(prev)} and ${formatPeriodKey(curr)}`);
    }
  }

  if (gaps.length >= 3) {
    return {
      type: 'missing-quarters',
      severity: 'critical',
      message: `${gaps.length} gaps detected in quarterly lodgement sequence`,
      affectedPeriods: gaps,
      recommendation:
        'Missing lodgements are a red flag for ATO review. Lodge all missing returns immediately.',
      details: { count: gaps.length, threshold: 3 },
    };
  }

  if (gaps.length >= 1) {
    return {
      type: 'missing-quarters',
      severity: 'high',
      message: `${gaps.length} gap(s) detected in quarterly lodgement sequence`,
      affectedPeriods: gaps,
      recommendation: 'Complete missing lodgements as soon as possible to maintain compliance.',
      details: { count: gaps.length, threshold: 1 },
    };
  }

  return null;
}

// Detector 3: Large amount variations
function detectLargeVariations(records: LodgementRecord[]): RiskFlag | null {
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  const variations: string[] = [];

  for (let i = 1; i < sortedRecords.length; i++) {
    const prev = sortedRecords[i - 1];
    const curr = sortedRecords[i];

    if (prev.amount === 0) continue;

    const percentChange = Math.abs((curr.amount - prev.amount) / prev.amount) * 100;

    if (percentChange > 100) {
      variations.push(
        `${formatPeriodKey(curr)}: ${percentChange.toFixed(0)}% change from previous period`,
      );
    }
  }

  if (variations.length >= 3) {
    return {
      type: 'large-variations',
      severity: 'medium',
      message: `${variations.length} periods with >100% amount variations`,
      affectedPeriods: variations,
      recommendation:
        'Large variations may trigger ATO review. Ensure all amounts are accurate and retain supporting documentation.',
      details: { count: variations.length, threshold: 3 },
    };
  }

  return null;
}

// Detector 4: Nil returns followed by large amounts
function detectNilThenLarge(records: LodgementRecord[]): RiskFlag | null {
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  const instances: string[] = [];

  for (let i = 1; i < sortedRecords.length; i++) {
    const prev = sortedRecords[i - 1];
    const curr = sortedRecords[i];

    if (prev.amount === 0 && curr.amount > 10000) {
      instances.push(`${formatPeriodKey(curr)}: $${curr.amount.toLocaleString()} after $0`);
    }
  }

  if (instances.length >= 2) {
    return {
      type: 'nil-then-large',
      severity: 'high',
      message: `${instances.length} instances of nil returns followed by large amounts`,
      affectedPeriods: instances,
      recommendation:
        'This pattern may indicate underreporting. Ensure all income and GST is accurately declared.',
      details: { count: instances.length, threshold: 2 },
    };
  }

  if (instances.length === 1) {
    return {
      type: 'nil-then-large',
      severity: 'medium',
      message: 'Nil return followed by large amount detected',
      affectedPeriods: instances,
      recommendation: 'Document the reason for the variation in case of ATO query.',
      details: { count: instances.length, threshold: 1 },
    };
  }

  return null;
}

// Detector 5: Excessive delays (>90 days late multiple times)
function detectExcessiveDelays(records: LodgementRecord[]): RiskFlag | null {
  const excessivelyLate = records.filter((r) => getDaysLate(r) > 90);

  if (excessivelyLate.length >= 3) {
    return {
      type: 'excessive-delays',
      severity: 'critical',
      message: `${excessivelyLate.length} lodgements more than 90 days late`,
      affectedPeriods: excessivelyLate.map(formatPeriodKey),
      recommendation:
        'Severe compliance issue. ATO may impose director penalties or garnishee orders. Seek immediate professional help.',
      details: { count: excessivelyLate.length, threshold: 3, metric: 90 },
    };
  }

  if (excessivelyLate.length >= 1) {
    return {
      type: 'excessive-delays',
      severity: 'high',
      message: `${excessivelyLate.length} lodgement(s) more than 90 days late`,
      affectedPeriods: excessivelyLate.map(formatPeriodKey),
      recommendation: 'Lodge overdue returns immediately to avoid escalating penalties.',
      details: { count: excessivelyLate.length, threshold: 1, metric: 90 },
    };
  }

  return null;
}

// Detector 6: Round number pattern (suspiciously round amounts)
function detectRoundNumberPattern(records: LodgementRecord[]): RiskFlag | null {
  const roundNumbers = records.filter((r) => r.amount > 0 && r.amount % 1000 === 0);

  const percentage = (roundNumbers.length / Math.max(records.length, 1)) * 100;

  if (percentage > 50 && records.length >= 4) {
    return {
      type: 'round-numbers',
      severity: 'medium',
      message: `${percentage.toFixed(0)}% of lodgements have suspiciously round amounts`,
      affectedPeriods: roundNumbers.map(formatPeriodKey),
      recommendation:
        'Round numbers may indicate estimates rather than actual figures. Use precise amounts from accounting records.',
      details: { count: roundNumbers.length, metric: percentage, threshold: 50 },
    };
  }

  return null;
}

// Detector 7: Decreasing compliance (trend of increasing delays)
function detectDecreasingCompliance(records: LodgementRecord[]): RiskFlag | null {
  const sortedRecords = [...records]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(-6); // Last 6 periods

  if (sortedRecords.length < 4) return null;

  const delays = sortedRecords.map((r) => getDaysLate(r));
  const firstHalf = delays.slice(0, Math.floor(delays.length / 2));
  const secondHalf = delays.slice(Math.floor(delays.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (avgSecond > avgFirst * 2 && avgSecond > 30) {
    return {
      type: 'decreasing-compliance',
      severity: 'high',
      message: 'Lodgement delays are increasing over time',
      affectedPeriods: sortedRecords.slice(-3).map(formatPeriodKey),
      recommendation:
        'Compliance is deteriorating. Review your lodgement process and consider professional assistance.',
      details: { metric: avgSecond, threshold: avgFirst * 2 },
    };
  }

  if (avgSecond > avgFirst * 1.5 && avgSecond > 14) {
    return {
      type: 'decreasing-compliance',
      severity: 'medium',
      message: 'Lodgement delays are trending upward',
      affectedPeriods: sortedRecords.slice(-3).map(formatPeriodKey),
      recommendation: 'Establish better systems to ensure timely lodgements.',
      details: { metric: avgSecond, threshold: avgFirst * 1.5 },
    };
  }

  return null;
}

// Detector 8: High penalty exposure
function detectHighPenaltyExposure(
  records: LodgementRecord[],
  penalties?: PenaltySchedule,
): RiskFlag | null {
  if (!penalties) return null;

  let totalPenalties = 0;
  const affectedPeriods: string[] = [];

  for (const record of records) {
    const daysLate = getDaysLate(record);
    if (daysLate > 0) {
      const estimate = estimateFailureToLodgePenalty(daysLate, penalties.failureToLodge);
      totalPenalties += estimate.amount;
      if (estimate.amount > 0) {
        affectedPeriods.push(`${formatPeriodKey(record)}: $${estimate.amount.toFixed(0)}`);
      }
    }
  }

  if (totalPenalties > 5000) {
    return {
      type: 'high-penalty-exposure',
      severity: 'critical',
      message: `Estimated $${totalPenalties.toFixed(0)} in Failure to Lodge penalties`,
      affectedPeriods,
      recommendation:
        'Penalties are accumulating. Lodge all overdue returns immediately to stop further penalties.',
      details: { metric: totalPenalties, threshold: 5000 },
    };
  }

  if (totalPenalties > 2000) {
    return {
      type: 'high-penalty-exposure',
      severity: 'high',
      message: `Estimated $${totalPenalties.toFixed(0)} in Failure to Lodge penalties`,
      affectedPeriods,
      recommendation: 'Significant penalty exposure. Prioritize catching up on overdue lodgements.',
      details: { metric: totalPenalties, threshold: 2000 },
    };
  }

  return null;
}

// Detector 9: Chronic non-compliance (>50% late rate)
function detectChronicNonCompliance(records: LodgementRecord[]): RiskFlag | null {
  if (records.length < 4) return null;

  const lateRecords = records.filter((r) => getDaysLate(r) > 0);
  const latePercentage = (lateRecords.length / records.length) * 100;

  if (latePercentage > 75) {
    return {
      type: 'chronic-non-compliance',
      severity: 'critical',
      message: `${latePercentage.toFixed(0)}% of lodgements are late`,
      affectedPeriods: lateRecords.map(formatPeriodKey),
      recommendation:
        'Chronic non-compliance. ATO may initiate recovery action. Seek immediate professional assistance.',
      details: { metric: latePercentage, threshold: 75, count: lateRecords.length },
    };
  }

  if (latePercentage > 50) {
    return {
      type: 'chronic-non-compliance',
      severity: 'high',
      message: `${latePercentage.toFixed(0)}% of lodgements are late`,
      affectedPeriods: lateRecords.map(formatPeriodKey),
      recommendation:
        'More than half your lodgements are late. Engage a tax agent to improve compliance.',
      details: { metric: latePercentage, threshold: 50, count: lateRecords.length },
    };
  }

  return null;
}

// Detector 10: Actual ATO Penalties (based on hasPenalty field)
function detectActualPenalties(records: LodgementRecord[]): RiskFlag | null {
  const penalizedRecords = records.filter((r) => r.hasPenalty);

  if (penalizedRecords.length === 0) {
    return null;
  }

  const totalPenalties = penalizedRecords.reduce((sum, r) => sum + (r.penaltyAmount || 0), 0);
  const affectedPeriods = penalizedRecords.map(formatPeriodKey);

  // 3+ penalties = critical risk
  if (penalizedRecords.length >= 3) {
    return {
      type: 'high-penalty-exposure',
      severity: 'critical',
      message: `${penalizedRecords.length} ATO penalties applied (total: $${totalPenalties.toFixed(2)})`,
      affectedPeriods,
      recommendation:
        'Multiple actual ATO penalties indicate severe compliance failures. This significantly increases investigation risk. Seek professional tax advice immediately.',
      details: {
        count: penalizedRecords.length,
        metric: totalPenalties,
        threshold: 3,
      },
    };
  }

  // 2 penalties = high risk
  if (penalizedRecords.length === 2) {
    return {
      type: 'high-penalty-exposure',
      severity: 'high',
      message: `${penalizedRecords.length} ATO penalties applied (total: $${totalPenalties.toFixed(2)})`,
      affectedPeriods,
      recommendation:
        'Two ATO penalties is a serious red flag. Review your lodgement processes immediately to avoid further penalties and potential investigation.',
      details: {
        count: penalizedRecords.length,
        metric: totalPenalties,
        threshold: 2,
      },
    };
  }

  // 1 penalty = low risk (everyone makes mistakes)
  return {
    type: 'high-penalty-exposure',
    severity: 'low',
    message: `1 ATO penalty applied ($${totalPenalties.toFixed(2)})`,
    affectedPeriods,
    recommendation:
      'Single penalty noted. Learn from this and ensure future compliance to avoid repeat penalties.',
    details: {
      count: 1,
      metric: totalPenalties,
      threshold: 1,
    },
  };
}

function calculateRiskScore(flags: RiskFlag[]): number {
  if (flags.length === 0) return 0;

  const baseSeverity = Math.max(...flags.map((f) => SEVERITY_WEIGHTS[f.severity]));
  const additionalFlags = (flags.length - 1) * 5;

  return Math.min(100, baseSeverity + additionalFlags);
}

function determineOverallRisk(score: number): RiskSeverity {
  if (score >= 80) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  if (score >= 10) return 'low';
  return 'none';
}

function generateSummary(overallRisk: RiskSeverity, flags: RiskFlag[]): string {
  if (overallRisk === 'none') {
    return 'No significant compliance issues detected. Continue maintaining timely lodgements.';
  }

  if (overallRisk === 'low') {
    return 'Minor compliance concerns detected. Address these issues to maintain good standing with the ATO.';
  }

  if (overallRisk === 'medium') {
    return 'Moderate compliance issues detected. Take action soon to avoid escalation to ATO review.';
  }

  if (overallRisk === 'high') {
    return `Serious compliance issues detected (${flags.length} red flags). Immediate action required to avoid ATO enforcement.`;
  }

  return `Critical compliance situation (${flags.length} severe issues). You are at high risk of ATO investigation, penalties, and enforcement action. Seek professional help immediately.`;
}

function generateRecommendations(flags: RiskFlag[]): string[] {
  const recommendations = new Set<string>();

  // Add unique recommendations from flags
  flags.forEach((flag) => recommendations.add(flag.recommendation));

  // Add general recommendations based on flag types
  const flagTypes = new Set(flags.map((f) => f.type));

  if (flagTypes.has('consecutive-late') || flagTypes.has('chronic-non-compliance')) {
    recommendations.add('Consider engaging a registered tax agent to manage lodgements.');
  }

  if (flagTypes.has('high-penalty-exposure')) {
    recommendations.add('Contact the ATO to discuss a payment plan for penalties.');
  }

  if (
    flagTypes.has('missing-quarters') ||
    flagTypes.has('excessive-delays') ||
    flagTypes.has('decreasing-compliance')
  ) {
    recommendations.add('Lodge all outstanding returns before the ATO initiates recovery action.');
  }

  return Array.from(recommendations);
}

export function assessInvestigationRisk(
  lodgementHistory: LodgementRecord[],
  penalties?: PenaltySchedule,
): RiskAssessment {
  const flags: RiskFlag[] = [];

  // Run all detectors
  const detectors = [
    () => detectConsecutiveLate(lodgementHistory),
    () => detectMissingQuarters(lodgementHistory),
    () => detectLargeVariations(lodgementHistory),
    () => detectNilThenLarge(lodgementHistory),
    () => detectExcessiveDelays(lodgementHistory),
    () => detectRoundNumberPattern(lodgementHistory),
    () => detectDecreasingCompliance(lodgementHistory),
    () => detectHighPenaltyExposure(lodgementHistory, penalties),
    () => detectChronicNonCompliance(lodgementHistory),
    () => detectActualPenalties(lodgementHistory), // NEW: Check actual ATO penalties
  ];

  for (const detector of detectors) {
    const flag = detector();
    if (flag) {
      flags.push(flag);
    }
  }

  const riskScore = calculateRiskScore(flags);
  const overallRisk = determineOverallRisk(riskScore);
  const summary = generateSummary(overallRisk, flags);
  const recommendations = generateRecommendations(flags);

  return {
    overallRisk,
    riskScore,
    flags,
    recommendations,
    summary,
    lastAnalyzed: new Date().toISOString(),
  };
}
