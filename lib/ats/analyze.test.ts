import { describe, expect, it } from "vitest";
import type {
  ResumeContent,
  ResumeDesign,
  ResumeLayout,
  ResumeSection,
} from "../../types/resume";
import {
  LONG_CONTENT,
  SHORT_CONTENT,
  SHORT_DESIGN,
} from "../../features/exports/fixtures";
import { analyzeAts } from "./analyze";
import { normalizeTitle } from "./sectionTitles";
import type { AtsInput } from "./types";

function personalSection(
  item: Record<string, unknown>,
  visible = true,
): ResumeSection {
  return {
    id: "personal",
    type: "personal",
    title: "Datos personales",
    order: 0,
    visible,
    items: [{ id: "p1", ...item }],
  } as ResumeSection;
}

function experienceSection(
  items: Record<string, unknown>[],
  title = "Experiencia",
  visible = true,
): ResumeSection {
  return {
    id: "exp",
    type: "experience",
    title,
    order: 1,
    visible,
    items: items.map((item, i) => ({ id: `e${i}`, ...item })),
  } as ResumeSection;
}

function educationSection(
  items: Record<string, unknown>[] = [
    { degree: "Ingeniería", field: "Informática" },
  ],
  title = "Formación",
  visible = true,
): ResumeSection {
  return {
    id: "edu",
    type: "education",
    title,
    order: 2,
    visible,
    items: items.map((item, i) => ({ id: `ed${i}`, ...item })),
  } as ResumeSection;
}

function inputWith(
  sections: ResumeSection[],
  designPatch: Partial<ResumeDesign> = {},
  layout: ResumeLayout | null = null,
): AtsInput {
  const content: ResumeContent = { sections };
  return {
    content,
    design: { ...SHORT_DESIGN, ...designPatch },
    layout,
    title: "CV",
  };
}

function goodPersonal() {
  return personalSection({ fullName: "Ana Ruiz", email: "ana@example.es" });
}

function ruleIds(report: ReturnType<typeof analyzeAts>): string[] {
  return report.issues.map((i) => i.ruleId);
}

describe("contacto", () => {
  it("no avisa con nombre y correo presentes", () => {
    const report = analyzeAts(
      inputWith([goodPersonal(), experienceSection([{ position: "Técnica" }])]),
    );
    expect(ruleIds(report)).not.toContain("contact.name-missing");
    expect(ruleIds(report)).not.toContain("contact.email-missing");
  });

  it("marca error si falta el nombre", () => {
    const report = analyzeAts(
      inputWith([
        personalSection({ fullName: "   ", email: "ana@example.es" }),
        experienceSection([{ position: "Técnica" }]),
      ]),
    );
    const issue = report.issues.find((i) => i.ruleId === "contact.name-missing");
    expect(issue?.severity).toBe("error");
  });

  it("marca error si falta el correo", () => {
    const report = analyzeAts(
      inputWith([
        personalSection({ fullName: "Ana Ruiz", email: "" }),
        experienceSection([{ position: "Técnica" }]),
      ]),
    );
    expect(ruleIds(report)).toContain("contact.email-missing");
  });

  it("evalúa la cabecera aunque esté oculta", () => {
    const report = analyzeAts(
      inputWith([
        personalSection({ fullName: "Ana Ruiz", email: "ana@example.es" }, false),
        experienceSection([{ position: "Técnica" }]),
      ]),
    );
    expect(ruleIds(report)).not.toContain("contact.name-missing");
    expect(ruleIds(report)).not.toContain("contact.email-missing");
  });
});

describe("placeholders", () => {
  it("marca error por puesto vacío", () => {
    const report = analyzeAts(
      inputWith([goodPersonal(), experienceSection([{ company: "Acme" }])]),
    );
    const issue = report.issues.find((i) => i.ruleId === "content.placeholder");
    expect(issue?.severity).toBe("error");
    expect(issue?.target?.itemId).toBe("e0");
  });

  it("no avisa con puesto relleno", () => {
    const report = analyzeAts(
      inputWith([goodPersonal(), experienceSection([{ position: "Técnica" }])]),
    );
    expect(
      report.issues.filter((i) => i.ruleId === "content.placeholder"),
    ).toHaveLength(0);
  });

  it("marca error por titulación vacía", () => {
    const report = analyzeAts(
      inputWith([
        goodPersonal(),
        experienceSection([{ position: "Técnica" }]),
        educationSection([{ school: "UPM" }]),
      ]),
    );
    expect(ruleIds(report)).toContain("content.placeholder");
  });
});

describe("estructura", () => {
  it("avisa sin experiencia y calla con experiencia", () => {
    const sin = analyzeAts(inputWith([goodPersonal(), educationSection()]));
    expect(ruleIds(sin)).toContain("structure.experience-missing");
    const con = analyzeAts(
      inputWith([
        goodPersonal(),
        experienceSection([{ position: "Técnica" }]),
        educationSection(),
      ]),
    );
    expect(ruleIds(con)).not.toContain("structure.experience-missing");
  });

  it("avisa sin formación y calla con formación", () => {
    const sin = analyzeAts(
      inputWith([goodPersonal(), experienceSection([{ position: "Técnica" }])]),
    );
    expect(ruleIds(sin)).toContain("structure.education-missing");
    const con = analyzeAts(
      inputWith([
        goodPersonal(),
        experienceSection([{ position: "Técnica" }]),
        educationSection(),
      ]),
    );
    expect(ruleIds(con)).not.toContain("structure.education-missing");
  });

  it("marca sección visible vacía e ignora la oculta", () => {
    const visible: ResumeSection = {
      id: "sk",
      type: "skills",
      title: "Competencias",
      order: 3,
      visible: true,
      items: [],
    };
    const oculta: ResumeSection = {
      id: "sk2",
      type: "skills",
      title: "Oculta",
      order: 4,
      visible: false,
      items: [],
    };
    const report = analyzeAts(
      inputWith([
        goodPersonal(),
        experienceSection([{ position: "Técnica" }]),
        educationSection(),
        visible,
        oculta,
      ]),
    );
    expect(report.issues.map((i) => i.id)).toContain("structure.section-empty:sk");
    expect(report.issues.map((i) => i.id)).not.toContain(
      "structure.section-empty:sk2",
    );
  });

  it("acepta títulos habituales con tildes, mayúsculas y en inglés", () => {
    for (const title of ["Formación", "FORMACION ", "Education"]) {
      const report = analyzeAts(
        inputWith([
          goodPersonal(),
          experienceSection([{ position: "Técnica" }]),
          educationSection([{ degree: "Grado" }], title),
        ]),
      );
      expect(
        report.issues.filter(
          (i) => i.ruleId === "structure.section-title-nonstandard",
        ),
      ).toHaveLength(0);
    }
  });

  it("propone título estándar con fix", () => {
    const report = analyzeAts(
      inputWith([
        goodPersonal(),
        experienceSection([{ position: "Técnica" }], "Mi historial guay"),
        educationSection(),
      ]),
    );
    const issue = report.issues.find(
      (i) => i.ruleId === "structure.section-title-nonstandard",
    );
    expect(issue?.fix).toEqual({
      kind: "renameSection",
      label: "Usar título estándar",
      sectionId: "exp",
      title: "Experiencia",
    });
  });
});

describe("contenido", () => {
  it("marca símbolos decorativos y permite guiones habituales", () => {
    const mal = analyzeAts(
      inputWith([
        goodPersonal(),
        experienceSection([{ position: "Técnica", description: "Liderazgo 🚀" }]),
        educationSection(),
      ]),
    );
    expect(ruleIds(mal)).toContain("content.decorative-symbols");
    const bien = analyzeAts(
      inputWith([
        goodPersonal(),
        experienceSection([
          { position: "Técnica", description: "Puntos • guiones – y —" },
        ]),
        educationSection(),
      ]),
    );
    expect(ruleIds(bien)).not.toContain("content.decorative-symbols");
  });

  it("marca enlace con etiqueta pero sin URL", () => {
    const report = analyzeAts(
      inputWith([
        personalSection({
          fullName: "Ana Ruiz",
          email: "ana@example.es",
          links: [{ id: "l1", label: "LinkedIn", url: "" }],
        }),
        experienceSection([{ position: "Técnica" }]),
        educationSection(),
      ]),
    );
    expect(ruleIds(report)).toContain("content.link-invalid");
  });

  it("marca URL con esquema peligroso y acepta https", () => {
    const mal = analyzeAts(
      inputWith([
        personalSection({
          fullName: "Ana Ruiz",
          email: "ana@example.es",
          links: [{ id: "l1", label: "X", url: "javascript:alert(1)" }],
        }),
        experienceSection([{ position: "Técnica" }]),
      ]),
    );
    expect(ruleIds(mal)).toContain("content.link-invalid");
    const bien = analyzeAts(
      inputWith([
        personalSection({
          fullName: "Ana Ruiz",
          email: "ana@example.es",
          links: [{ id: "l1", label: "Portfolio", url: "https://ana.example" }],
        }),
        experienceSection([{ position: "Técnica" }]),
        educationSection(),
      ]),
    );
    expect(ruleIds(bien)).not.toContain("content.link-invalid");
  });
});

describe("diseño", () => {
  const twoColLayout: ResumeLayout = { main: ["personal", "exp"], sidebar: ["sk"] };
  const skills: ResumeSection = {
    id: "sk",
    type: "skills",
    title: "Competencias",
    order: 3,
    visible: true,
    items: [{ id: "s1", name: "TS" }],
  };

  it("no avisa en una columna y avisa en dos con fix", () => {
    const una = analyzeAts(
      inputWith(
        [goodPersonal(), experienceSection([{ position: "Técnica" }]), skills],
        { layoutId: "single" },
        twoColLayout,
      ),
    );
    expect(ruleIds(una)).not.toContain("design.two-columns");
    const dos = analyzeAts(
      inputWith(
        [goodPersonal(), experienceSection([{ position: "Técnica" }]), skills],
        { layoutId: "two-col" },
        twoColLayout,
      ),
    );
    const issue = dos.issues.find((i) => i.ruleId === "design.two-columns");
    expect(issue?.fix).toEqual({
      kind: "setDesign",
      label: "Pasar a una columna",
      patch: { layoutId: "single" },
    });
  });

  it("avisa con letra pequeña y propone 11 pt", () => {
    const report = analyzeAts(
      inputWith([goodPersonal()], { fontSize: 9 }),
    );
    const issue = report.issues.find((i) => i.ruleId === "design.font-size");
    expect(issue?.severity).toBe("info");
    expect(issue?.fix).toEqual({
      kind: "setDesign",
      label: "Subir a 11 pt",
      patch: { fontSize: 11 },
    });
  });

  it("avisa con márgenes estrechos y propone 13 mm", () => {
    const report = analyzeAts(
      inputWith([goodPersonal()], { pageMargin: 8 }),
    );
    expect(ruleIds(report)).toContain("design.margin");
  });
});

describe("puntuación e informe", () => {
  it("SHORT_CONTENT en clásica: sin errores y nivel alto", () => {
    const report = analyzeAts({
      content: SHORT_CONTENT,
      design: SHORT_DESIGN,
      layout: null,
      title: "CV",
    });
    expect(report.counts.error).toBe(0);
    expect(report.level).toBe("high");
  });

  it("LONG_CONTENT en clásica: sin errores y nivel alto", () => {
    const report = analyzeAts({
      content: LONG_CONTENT,
      design: SHORT_DESIGN,
      layout: null,
      title: "CV",
    });
    expect(report.counts.error).toBe(0);
    expect(report.level).toBe("high");
  });

  it("es determinista", () => {
    const make = () =>
      analyzeAts({
        content: LONG_CONTENT,
        design: SHORT_DESIGN,
        layout: null,
        title: "CV",
      });
    expect(make()).toEqual(make());
  });

  it("acota la penalización por regla", () => {
    const items = Array.from({ length: 10 }, () => ({ company: "Acme" }));
    const report = analyzeAts(
      inputWith([
        goodPersonal(),
        experienceSection(items),
        educationSection(),
      ]),
    );
    expect(report.score).toBe(70);
    expect(report.level).toBe("medium");
  });

  it("ordena error, aviso e info", () => {
    const report = analyzeAts(
      inputWith([personalSection({ fullName: "", email: "" })], {
        fontSize: 9,
      }),
    );
    const order = report.issues.map((i) => i.severity);
    const sorted = [...order].sort((a, b) =>
      ["error", "warning", "info"].indexOf(a) -
      ["error", "warning", "info"].indexOf(b),
    );
    expect(order).toEqual(sorted);
    expect(order[0]).toBe("error");
  });

  it("normaliza títulos", () => {
    expect(normalizeTitle("  FORMACIÓN ")).toBe("formacion");
    expect(normalizeTitle("Education")).toBe("education");
  });
});
