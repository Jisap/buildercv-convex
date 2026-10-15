"use client";

import {
  Check,
  CircleAlert,
  Info,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JOB_TEXT_MAX_CHARS } from "@/lib/ats/keywords";
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
  targetRole,
  jobPosting,
  onTargetRoleChange,
  onJobPostingChange,
  onGoToSection,
  onApplyFix,
}: {
  report: AtsReport;
  /** Puesto al que se destina el CV (local: no se persiste). */
  targetRole: string;
  /** Texto de la oferta (local: no se persiste ni sale del navegador). */
  jobPosting: string;
  onTargetRoleChange: (value: string) => void;
  onJobPostingChange: (value: string) => void;
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

      <section
        aria-label="Puesto y oferta"
        className="rounded-xl border border-border bg-card p-4 text-card-foreground"
      >
        <div className="grid gap-3">
          <div>
            <Label htmlFor="ats-puesto">Puesto objetivo</Label>
            <Input
              id="ats-puesto"
              value={targetRole}
              onChange={(e) => onTargetRoleChange(e.target.value)}
              placeholder="P. ej. «Desarrolladora frontend»"
              maxLength={120}
              autoComplete="off"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="ats-oferta">Texto de la oferta</Label>
            <textarea
              id="ats-oferta"
              value={jobPosting}
              onChange={(e) => onJobPostingChange(e.target.value)}
              placeholder="Pega aquí la descripción de la oferta…"
              rows={5}
              maxLength={JOB_TEXT_MAX_CHARS}
              className="mt-1 flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>No se guarda: vive solo en esta pestaña.</span>
              <span className="shrink-0 tabular-nums">
                {jobPosting.length}/{JOB_TEXT_MAX_CHARS}
              </span>
            </div>
          </div>
        </div>

        {report.keywords ? (
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-sm font-medium text-foreground">
              Cobertura: {report.keywords.covered} de {report.keywords.total}{" "}
              términos en tu CV
            </p>
            {report.keywords.truncated && (
              <p className="mt-1 text-xs text-muted-foreground">
                Oferta recortada a {JOB_TEXT_MAX_CHARS} caracteres.
              </p>
            )}
            {report.keywords.total === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                La oferta no aporta términos relevantes. ¿Texto demasiado
                corto?
              </p>
            ) : (
              <>
                <ul
                  aria-label="Términos cubiertos"
                  className="mt-2 flex flex-wrap gap-1.5"
                >
                  {report.keywords.terms
                    .filter((t) => t.found)
                    .map((t) => (
                      <li
                        key={t.term}
                        className="flex items-center gap-1 rounded-full border border-success/50 px-2 py-0.5 text-xs text-success"
                      >
                        <Check className="size-3 shrink-0" aria-hidden />
                        {t.term}
                      </li>
                    ))}
                </ul>
                {report.keywords.covered < report.keywords.total && (
                  <>
                    <p className="mt-3 text-xs font-medium text-foreground">
                      Ausentes en tu CV
                    </p>
                    <ul
                      aria-label="Términos ausentes"
                      className="mt-1 flex flex-wrap gap-1.5"
                    >
                      {report.keywords.terms
                        .filter((t) => !t.found)
                        .map((t) => (
                          <li
                            key={t.term}
                            className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {t.term}
                          </li>
                        ))}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Solo añade términos que reflejen tu experiencia real.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Indica el puesto o pega una oferta para ver qué términos cubre tu
            CV.
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
