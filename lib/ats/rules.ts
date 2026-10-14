import type { ResumeSection } from "../../types/resume";
import { partitionForLayout } from "../../features/templates/layout";
import { normalizeLinkUrl } from "../links";
import { CANONICAL_TITLES, isStandardTitle } from "./sectionTitles";
import type { AtsInput, AtsIssue, AtsRule } from "./types";

function visibleSections(input: AtsInput): ResumeSection[] {
  return input.content.sections.filter((s) => s.visible);
}

function personalItem(input: AtsInput) {
  const personal = input.content.sections.find((s) => s.type === "personal");
  if (!personal || personal.type !== "personal") {
    return undefined;
  }
  return personal.items[0];
}

function sectionLabel(input: AtsInput, sectionId: string): string {
  const found = input.content.sections.find((s) => s.id === sectionId);
  return found && found.title.trim() ? `«${found.title.trim()}»` : "La sección";
}

const contactNameMissing: AtsRule = (input) => {
  const name = personalItem(input)?.fullName ?? "";
  if (name.trim() !== "") {
    return [];
  }
  return [
    {
      id: "contact.name-missing",
      ruleId: "contact.name-missing",
      severity: "error",
      category: "structure",
      message: "Falta el nombre completo.",
      hint: "Añade tu nombre y apellidos en los datos personales.",
      target: { sectionId: input.content.sections.find((s) => s.type === "personal")?.id },
    },
  ];
};

const contactEmailMissing: AtsRule = (input) => {
  const email = personalItem(input)?.email ?? "";
  if (email.trim() !== "") {
    return [];
  }
  return [
    {
      id: "contact.email-missing",
      ruleId: "contact.email-missing",
      severity: "error",
      category: "structure",
      message: "Falta el correo electrónico.",
      hint: "Añade un correo válido en los datos personales.",
      target: { sectionId: input.content.sections.find((s) => s.type === "personal")?.id },
    },
  ];
};

const experienceMissing: AtsRule = (input) => {
  const ok = visibleSections(input).some(
    (s) => s.type === "experience" && s.items.length > 0,
  );
  if (ok) {
    return [];
  }
  return [
    {
      id: "structure.experience-missing",
      ruleId: "structure.experience-missing",
      severity: "warning",
      category: "structure",
      message: "No hay experiencia con contenido.",
      hint: "Añade una sección de experiencia visible con al menos un puesto.",
    },
  ];
};

const educationMissing: AtsRule = (input) => {
  const ok = visibleSections(input).some(
    (s) => s.type === "education" && s.items.length > 0,
  );
  if (ok) {
    return [];
  }
  return [
    {
      id: "structure.education-missing",
      ruleId: "structure.education-missing",
      severity: "warning",
      category: "structure",
      message: "No hay formación con contenido.",
      hint: "Añade una sección de formación visible con al menos un estudio.",
    },
  ];
};

const sectionEmpty: AtsRule = (input) => {
  const issues: AtsIssue[] = [];
  for (const section of visibleSections(input)) {
    if (section.type === "personal") {
      continue;
    }
    if (section.type === "profile") {
      const text = section.items[0]?.text ?? "";
      if (text.trim() === "") {
        issues.push({
          id: `structure.section-empty:${section.id}`,
          ruleId: "structure.section-empty",
          severity: "warning",
          category: "structure",
          message: `${sectionLabel(input, section.id)} está vacía.`,
          hint: "Escribe el texto del perfil o quita la sección.",
          target: { sectionId: section.id },
        });
      }
      continue;
    }
    if (section.items.length === 0) {
      issues.push({
        id: `structure.section-empty:${section.id}`,
        ruleId: "structure.section-empty",
        severity: "warning",
        category: "structure",
        message: `${sectionLabel(input, section.id)} no tiene elementos.`,
        hint: "Añade un elemento o quita la sección.",
        target: { sectionId: section.id },
      });
    }
  }
  return issues;
};

const sectionTitleNonstandard: AtsRule = (input) => {
  const issues: AtsIssue[] = [];
  for (const section of visibleSections(input)) {
    if (section.type === "personal" || section.type === "custom") {
      continue;
    }
    if (isStandardTitle(section.type, section.title)) {
      continue;
    }
    issues.push({
      id: `structure.section-title-nonstandard:${section.id}`,
      ruleId: "structure.section-title-nonstandard",
      severity: "warning",
      category: "structure",
      message: `${sectionLabel(input, section.id)} usa un título poco habitual.`,
      hint: `Los sistemas automáticos reconocen mejor «${CANONICAL_TITLES[section.type]}».`,
      target: { sectionId: section.id },
      fix: {
        kind: "renameSection",
        label: "Usar título estándar",
        sectionId: section.id,
        title: CANONICAL_TITLES[section.type],
      },
    });
  }
  return issues;
};

const placeholder: AtsRule = (input) => {
  const issues: AtsIssue[] = [];
  for (const section of visibleSections(input)) {
    if (section.type === "experience") {
      for (const item of section.items) {
        if ((item.position ?? "").trim() === "") {
          issues.push({
            id: `content.placeholder:${section.id}:${item.id}`,
            ruleId: "content.placeholder",
            severity: "error",
            category: "content",
            message: `${sectionLabel(input, section.id)} tiene un puesto sin completar.`,
            hint: "El PDF mostraría el texto «Puesto». Rellénalo o elimina el elemento.",
            target: { sectionId: section.id, itemId: item.id },
          });
        }
      }
    }
    if (section.type === "education") {
      for (const item of section.items) {
        if (
          (item.degree ?? "").trim() === "" &&
          (item.field ?? "").trim() === ""
        ) {
          issues.push({
            id: `content.placeholder:${section.id}:${item.id}`,
            ruleId: "content.placeholder",
            severity: "error",
            category: "content",
            message: `${sectionLabel(input, section.id)} tiene una titulación sin completar.`,
            hint: "El PDF mostraría el texto «Titulación». Rellénala o elimina el elemento.",
            target: { sectionId: section.id, itemId: item.id },
          });
        }
      }
    }
    if (section.type === "projects") {
      for (const item of section.items) {
        if ((item.name ?? "").trim() === "") {
          issues.push({
            id: `content.placeholder:${section.id}:${item.id}`,
            ruleId: "content.placeholder",
            severity: "error",
            category: "content",
            message: `${sectionLabel(input, section.id)} tiene un proyecto sin nombre.`,
            hint: "El PDF mostraría el texto «Proyecto». Rellénalo o elimina el elemento.",
            target: { sectionId: section.id, itemId: item.id },
          });
        }
      }
    }
    if (section.type === "languages") {
      for (const item of section.items) {
        if ((item.name ?? "").trim() === "") {
          issues.push({
            id: `content.placeholder:${section.id}:${item.id}`,
            ruleId: "content.placeholder",
            severity: "error",
            category: "content",
            message: `${sectionLabel(input, section.id)} tiene un idioma sin nombre.`,
            hint: "Rellena el nombre del idioma o elimina el elemento.",
            target: { sectionId: section.id, itemId: item.id },
          });
        }
      }
    }
  }
  return issues;
};

const DECORATIVE_RE = new RegExp(
  "[\\p{Extended_Pictographic}\\u2190-\\u21FF\\u2500-\\u27BF\\u2B00-\\u2BFF\\uFE0F\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]",
  "u",
);

function textsOf(section: ResumeSection): string[] {
  const out: string[] = [];
  for (const item of section.items) {
    for (const value of Object.values(item)) {
      if (typeof value === "string" && value !== "") {
        out.push(value);
      }
      if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === "string" && entry !== "") {
            out.push(entry);
          }
          if (entry && typeof entry === "object") {
            for (const nested of Object.values(entry)) {
              if (typeof nested === "string" && nested !== "") {
                out.push(nested);
              }
            }
          }
        }
      }
    }
  }
  return out;
}

const decorativeSymbols: AtsRule = (input) => {
  const issues: AtsIssue[] = [];
  for (const section of visibleSections(input)) {
    const offending = section.items.find((item) =>
      textsOf({ ...section, items: [item] } as ResumeSection).some((t) =>
        DECORATIVE_RE.test(t),
      ),
    );
    if (offending) {
      issues.push({
        id: `content.decorative-symbols:${section.id}:${offending.id}`,
        ruleId: "content.decorative-symbols",
        severity: "warning",
        category: "content",
        message: `${sectionLabel(input, section.id)} contiene símbolos decorativos o emojis.`,
        hint: "algunos sistemas no los leen. Usa texto y guiones simples (-, •, –, —).",
        target: { sectionId: section.id, itemId: offending.id },
      });
    }
  }
  return issues;
};

const linkInvalid: AtsRule = (input) => {
  const issues: AtsIssue[] = [];
  for (const section of visibleSections(input)) {
    if (section.type === "personal") {
      for (const item of section.items) {
        for (const link of item.links ?? []) {
          const url = (link.url ?? "").trim();
          if (((link.label ?? "").trim() !== "" && url === "") || (url !== "" && normalizeLinkUrl(url) === null)) {
            issues.push({
              id: `content.link-invalid:${section.id}:${link.id}`,
              ruleId: "content.link-invalid",
              severity: "warning",
              category: "content",
              message: "Hay un enlace que no lleva a ningún destino.",
              hint: "Revisa la URL (https://…) o quita el enlace.",
              target: { sectionId: section.id, itemId: item.id },
            });
          }
        }
      }
    }
    if (section.type === "projects") {
      for (const item of section.items) {
        const url = (item.url ?? "").trim();
        if (url !== "" && normalizeLinkUrl(url) === null) {
          issues.push({
            id: `content.link-invalid:${section.id}:${item.id}`,
            ruleId: "content.link-invalid",
            severity: "warning",
            category: "content",
            message: `${sectionLabel(input, section.id)} tiene un proyecto con URL no válida.`,
            hint: "Revisa la URL (https://…) o quítala.",
            target: { sectionId: section.id, itemId: item.id },
          });
        }
      }
    }
  }
  return issues;
};

const twoColumns: AtsRule = (input) => {
  if (input.design.layoutId !== "two-col") {
    return [];
  }
  const partition = partitionForLayout(
    input.content.sections,
    input.design.layoutId,
    input.layout,
  );
  if (partition.sidebar.length === 0) {
    return [];
  }
  return [
    {
      id: "design.two-columns",
      ruleId: "design.two-columns",
      severity: "warning",
      category: "design",
      message: "El CV usa dos columnas.",
      hint: "algunos sistemas leen las columnas en orden mezclado. Una columna se lee mejor.",
      target: { panel: "design" },
      fix: {
        kind: "setDesign",
        label: "Pasar a una columna",
        patch: { layoutId: "single" },
      },
    },
  ];
};

const fontSize: AtsRule = (input) => {
  if (input.design.fontSize >= 10) {
    return [];
  }
  return [
    {
      id: "design.font-size",
      ruleId: "design.font-size",
      severity: "info",
      category: "design",
      message: "El tamaño de letra es muy pequeño.",
      hint: "Con menos de 10 pt el texto puede resultar ilegible.",
      target: { panel: "design" },
      fix: { kind: "setDesign", label: "Subir a 11 pt", patch: { fontSize: 11 } },
    },
  ];
};

const pageMargin: AtsRule = (input) => {
  if (input.design.pageMargin >= 10) {
    return [];
  }
  return [
    {
      id: "design.margin",
      ruleId: "design.margin",
      severity: "info",
      category: "design",
      message: "Los márgenes son muy estrechos.",
      hint: "Con menos de 10 mm el contenido puede quedar pegado al borde.",
      target: { panel: "design" },
      fix: {
        kind: "setDesign",
        label: "Ampliar a 13 mm",
        patch: { pageMargin: 13 },
      },
    },
  ];
};

export const RULES: { ruleId: string; run: AtsRule }[] = [
  { ruleId: "contact.name-missing", run: contactNameMissing },
  { ruleId: "contact.email-missing", run: contactEmailMissing },
  { ruleId: "content.placeholder", run: placeholder },
  { ruleId: "structure.experience-missing", run: experienceMissing },
  { ruleId: "structure.education-missing", run: educationMissing },
  { ruleId: "structure.section-empty", run: sectionEmpty },
  { ruleId: "structure.section-title-nonstandard", run: sectionTitleNonstandard },
  { ruleId: "content.decorative-symbols", run: decorativeSymbols },
  { ruleId: "content.link-invalid", run: linkInvalid },
  { ruleId: "design.two-columns", run: twoColumns },
  { ruleId: "design.font-size", run: fontSize },
  { ruleId: "design.margin", run: pageMargin },
];
