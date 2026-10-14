import { RULES } from "./rules";
import { scoreFor } from "./scoring";
import type {
  AtsInput,
  AtsIssue,
  AtsReport,
  AtsSeverity,
} from "./types";

const SEVERITY_ORDER: Record<AtsSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export function analyzeAts(input: AtsInput): AtsReport {
  const issues: AtsIssue[] = [];
  const penalties: { severity: AtsSeverity; count: number }[] = [];
  for (const { ruleId, run } of RULES) {
    const found = run(input);
    for (const issue of found) {
      if (issue.ruleId !== ruleId) {
        continue;
      }
      issues.push(issue);
    }
    if (found.length > 0) {
      penalties.push({ severity: found[0].severity, count: found.length });
    }
  }
  issues.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.ruleId.localeCompare(b.ruleId) ||
      a.id.localeCompare(b.id),
  );
  const { score, level } = scoreFor(penalties);
  return {
    score,
    level,
    issues,
    counts: {
      error: issues.filter((i) => i.severity === "error").length,
      warning: issues.filter((i) => i.severity === "warning").length,
      info: issues.filter((i) => i.severity === "info").length,
    },
  };
}
