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
}

export type AtsLevel = "high" | "medium" | "low";

export interface AtsReport {
  score: number;
  level: AtsLevel;
  issues: AtsIssue[];
  counts: Record<AtsSeverity, number>;
}

export type AtsRule = (input: AtsInput) => AtsIssue[];
