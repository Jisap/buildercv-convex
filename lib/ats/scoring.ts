import type { AtsLevel, AtsSeverity } from "./types";

export const WEIGHTS = { error: 15, warning: 6, info: 0 } as const;
export const CAP_PER_RULE = { error: 30, warning: 12, info: 0 } as const;
export const LEVEL_THRESHOLDS = { high: 85, medium: 60 } as const;

export function rulePenalty(severity: AtsSeverity, count: number): number {
  return Math.min(CAP_PER_RULE[severity], count * WEIGHTS[severity]);
}

export function levelFor(score: number): AtsLevel {
  if (score >= LEVEL_THRESHOLDS.high) {
    return "high";
  }
  if (score >= LEVEL_THRESHOLDS.medium) {
    return "medium";
  }
  return "low";
}

export function scoreFor(
  penalties: { severity: AtsSeverity; count: number }[],
): { score: number; level: AtsLevel } {
  const total = penalties.reduce(
    (sum, p) => sum + rulePenalty(p.severity, p.count),
    0,
  );
  const score = Math.max(0, Math.min(100, Math.round(100 - total)));
  return { score, level: levelFor(score) };
}
