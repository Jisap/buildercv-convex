"use client";

import { CircleAlert, Info, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AtsIssue, AtsReport } from "@/lib/ats/types";

const LEVEL_LABEL: Record<AtsReport["level"], string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

function IssueIcon({ issue }: { issue: AtsIssue }) {
  if (issue.severity === "error") {
    return <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden />;
  }
  if (issue.severity === "warning") {
    return <TriangleAlert className="size-4 shrink-0" aria-hidden />;
  }
  return <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
}

function severityLabel(issue: AtsIssue): string {
  if (issue.severity === "error") {
    return "Error";
  }
  if (issue.severity === "warning") {
    return "Aviso";
  }
  return "Info";
}

export function AtsPanel({
  report,
  onGoToSection,
  onApplyFix,
}: {
  report: AtsReport;
  onGoToSection: (target: NonNullable<AtsIssue["target"]>) => void;
  onApplyFix: (fix: NonNullable<AtsIssue["fix"]>) => void;
}) {
  const total = report.issues.length;
  return (
    <div className="space-y-4">
      <section
        aria-label="Nivel de compatibilidad"
        aria-live="polite"
        className="rounded-xl border border-border bg-card p-4 text-card-foreground"
      >
        <p className="text-sm text-muted-foreground">Compatibilidad: {LEVEL_LABEL[report.level]}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          {LEVEL_LABEL[report.level]}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({report.score}/100)
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Orientativo: cada sistema de selección interpreta los currículums de
          forma distinta.
        </p>
        {total > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {report.counts.error} errores · {report.counts.warning} avisos ·{" "}
            {report.counts.info} infos
          </p>
        )}
      </section>

      {total === 0 ? (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden />
          Sin problemas detectados.
        </p>
      ) : (
        <ul className="space-y-2">
          {report.issues.map((issue) => (
            <li
              key={issue.id}
              className="rounded-xl border border-border bg-card p-3 text-card-foreground"
            >
              <p className="flex items-center gap-2 text-xs font-medium">
                <IssueIcon issue={issue} />
                <span
                  className={
                    issue.severity === "error"
                      ? "text-destructive"
                      : issue.severity === "warning"
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }
                >
                  {severityLabel(issue)}
                </span>
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {issue.message}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{issue.hint}</p>
              {(issue.target || issue.fix) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {issue.target && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGoToSection(issue.target!)}
                    >
                      Ir a la sección
                    </Button>
                  )}
                  {issue.fix && (
                    <Button size="sm" onClick={() => onApplyFix(issue.fix!)}>
                      {issue.fix.label}
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
