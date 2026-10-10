/**
 * @vitest-environment jsdom
 */
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { ResumeContent, ResumeDesign } from "@/types/resume";
import { TEMPLATES } from "./types";
import { TemplateRenderer } from "./TemplateRenderer";

// Fixture largo: todos los tipos de sección, varias experiencias, listas
// extensas, caracteres españoles y una sección oculta.
const content: ResumeContent = {
  sections: [
    {
      id: "s-personal",
      type: "personal",
      title: "Datos personales",
      order: 0,
      visible: true,
      items: [
        {
          id: "p1",
          fullName: "María López García",
          email: "maria@example.es",
          phone: "+34 600 111 222",
          location: "Sevilla, España",
          links: [{ id: "l1", label: "LinkedIn", url: "https://linkedin.example/maria" }],
        },
      ],
    },
    {
      id: "s-profile",
      type: "profile",
      title: "Perfil profesional",
      order: 1,
      visible: true,
      items: [{ id: "pr1", text: "Diseñadora con diez años de experiencia." }],
    },
    {
      id: "s-exp",
      type: "experience",
      title: "Experiencia",
      order: 2,
      visible: true,
      items: [
        {
          id: "e1",
          position: "Jefa de proyecto",
          company: "Acme S.L.",
          location: "Madrid",
          startDate: "2020-01",
          endDate: undefined,
          current: true,
          description: "Lideré un equipo de ocho personas.",
        },
        {
          id: "e2",
          position: "Analista",
          company: "Beta S.A.",
          startDate: "2016-03",
          endDate: "2019-12",
          description: "Análisis de datos y ñoñerías varias.",
        },
      ],
    },
    {
      id: "s-edu",
      type: "education",
      title: "Formación",
      order: 3,
      visible: true,
      items: [
        { id: "ed1", school: "Universidad de Sevilla", degree: "Grado", field: "Diseño" },
      ],
    },
    {
      id: "s-skills",
      type: "skills",
      title: "Competencias",
      order: 4,
      visible: true,
      items: [
        { id: "sk1", name: "Comunicación", level: 5 },
        { id: "sk2", name: "Gestión del tiempo" },
      ],
    },
    {
      id: "s-lang",
      type: "languages",
      title: "Idiomas",
      order: 5,
      visible: true,
      items: [
        { id: "lg1", name: "Inglés", level: "C1" },
        { id: "lg2", name: "Francés", level: "B1" },
      ],
    },
    {
      id: "s-proj",
      type: "projects",
      title: "Proyectos",
      order: 6,
      visible: true,
      items: [
        {
          id: "pj1",
          name: "Portal del ciudadano",
          description: "Trámites en línea.",
          technologies: ["React", "TypeScript"],
        },
      ],
    },
    {
      id: "s-custom",
      type: "custom",
      title: "Voluntariado",
      order: 7,
      visible: true,
      items: [{ id: "c1", title: "Mentora", description: "Acompañamiento." }],
    },
    {
      id: "s-hidden",
      type: "skills",
      title: "Oculta",
      order: 8,
      visible: false,
      items: [{ id: "h1", name: "TextoQueNoDebeAparecer" }],
    },
  ],
};

const design: ResumeDesign = {
  templateId: "classic",
  templateVersion: 1,
  accentColor: "#b91c1c",
  fontFamily: "georgia",
};

const MUST_CONTAIN = [
  "María López García",
  "maria@example.es",
  "LinkedIn",
  "Diseñadora con diez años",
  "Jefa de proyecto",
  "Acme S.L.",
  "actualidad",
  "ñoñerías",
  "Universidad de Sevilla",
  "Comunicación",
  "Inglés",
  "Portal del ciudadano",
  "React, TypeScript",
  "Mentora",
  "Voluntariado",
];

test("las tres plantillas usan el mismo modelo de contenido", () => {
  expect(TEMPLATES.map((t) => t.id)).toEqual(["classic", "modern", "compact"]);
  for (const meta of TEMPLATES) {
    const html = renderToStaticMarkup(
      <TemplateRenderer
        content={content}
        design={{ ...design, templateId: meta.id }}
        mode="preview"
      />,
    );
    for (const text of MUST_CONTAIN) {
      expect(html, `${meta.id} debe contener «${text}»`).toContain(text);
    }
    // Las secciones ocultas nunca se renderizan.
    expect(html).not.toContain("TextoQueNoDebeAparecer");
    expect(html).not.toContain(">Oculta<");
    // El acento configurado se aplica (las tres lo usan de algún modo).
    expect(html, `${meta.id} debe aplicar el acento`).toContain("#b91c1c");
  }
});

test("mode print no añade cromo de previsualización", () => {
  const html = renderToStaticMarkup(
    <TemplateRenderer content={content} design={design} mode="print" />,
  );
  expect(html).not.toContain("shadow-sm");
  expect(html).toContain("María López García");
});
