import type {
  ResumeContent,
  ResumeDesign,
  ResumeLayout,
} from "../../types/resume";

export type AtsSeverity = "error" | "warning" | "info";
export type AtsCategory = "structure" | "content" | "design";

export type AtsFix =
  | { kind: "setDesign"; label: string; patch: Partial<ResumeDesign> }
  | { kind: "renameSection"; label: string; sectionId: string; title: string };

export interface AtsIssue {
  /** `ruleId` + destino: estable entre renders (clave de React). */
  id: string;
  ruleId: string;
  severity: AtsSeverity;
  category: AtsCategory;
  message: string;
  hint: string;
  target?: { sectionId?: string; itemId?: string; panel?: "design" };
  fix?: AtsFix;
}

export interface AtsInput {
  content: ResumeContent;
  design: ResumeDesign;
  layout?: ResumeLayout | null;
  title: string;
  /** Puesto al que se destina el CV (Capa 3, local, no se persiste). */
  targetRole?: string;
  /** Texto de la oferta pegado por el usuario (Capa 3, no se persiste). */
  jobPosting?: string;
}

export type AtsLevel = "high" | "medium" | "low";

export interface AtsReport {
  score: number;
  level: AtsLevel;
  issues: AtsIssue[];
  counts: Record<AtsSeverity, number>;
  /** Cobertura de la oferta (Capa 3). `null` = sin puesto ni oferta.
   * Informativa: no entra en la puntuación. */
  keywords?: AtsKeywordReport | null;
}

export interface AtsKeywordTerm {
  term: string;
  /** Veces que aparece en la oferta. */
  count: number;
  found: boolean;
}

export interface AtsKeywordReport {
  terms: AtsKeywordTerm[];
  covered: number;
  total: number;
  /** La oferta superaba el límite y se recortó. */
  truncated: boolean;
}

export type AtsRule = (input: AtsInput) => AtsIssue[];
