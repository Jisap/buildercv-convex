/**
 * @vitest-environment jsdom
 */
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { ResumeContent, ResumeDesign } from "@/types/resume";
import { layoutFromContent } from "@/lib/resume-layout";
import { TEMPLATES } from "./types";
import { TemplateRenderer } from "./TemplateRenderer";
import { docRootStyle, twoColColumns } from "./shared";

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
  fontSize: 11,
  pageMargin: 13,
  sectionSpacing: 5,
  lineHeight: 1.5,
  headingSize: "regular",
  sidebarWidth: 33,
  layoutId: "single",
};

const layout = layoutFromContent(content);

const MUST_CONTAIN = [  "María López García",
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

test("las plantillas usan el mismo modelo de contenido", () => {
  expect(TEMPLATES.map((t) => t.id)).toEqual([
    "classic",
    "modern",
    "compact",
    "sidebar",
    "elegant",
    "minimal",
    "energetic",
    "technical",
  ]);
  for (const meta of TEMPLATES) {
    const html = renderToStaticMarkup(
      <TemplateRenderer
        content={content}
        design={{ ...design, templateId: meta.id }}
        layout={layout}
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
    <TemplateRenderer content={content} design={design} layout={layout} mode="print" />,
  );
  expect(html).not.toContain("shadow-sm");
  expect(html).toContain("María López García");
});

test("lateral en dos columnas usa banda con acento", () => {
  const html = renderToStaticMarkup(
    <TemplateRenderer
      content={content}
      design={{ ...design, templateId: "sidebar", layoutId: "two-col" }}
      layout={layout}
      mode="preview"
    />,
  );
  expect(html).toContain("cv-aside");
  expect(html).toContain("#b91c1c");
  // Orden de lectura: principal antes que lateral en el DOM.
  expect(html.indexOf("cv-layout-main")).toBeLessThan(html.indexOf("cv-aside"));
});

test("elegante centra solo la cabecera y usa acento en su filete", () => {
  const html = renderToStaticMarkup(
    <TemplateRenderer
      content={content}
      design={{ ...design, templateId: "elegant" }}
      layout={layout}
      mode="preview"
    />,
  );
  expect(html).toContain("cv-elegant-head");
  expect(html).toContain("#b91c1c");
});

test("mínima no usa pills ni bandas", () => {
  const html = renderToStaticMarkup(
    <TemplateRenderer
      content={content}
      design={{ ...design, templateId: "minimal" }}
      layout={layout}
      mode="preview"
    />,
  );
  expect(html).not.toContain("cv-pills");
  expect(html).not.toContain("cv-band");
  expect(html).toContain("#b91c1c");
});

test("el layout explícito manda sobre la derivación por tipo", () => {
  const html = renderToStaticMarkup(
    <TemplateRenderer
      content={content}
      design={{ ...design, templateId: "classic", layoutId: "two-col" }}
      layout={{ main: ["s-exp", "s-skills"], sidebar: ["s-lang"] }}
      mode="preview"
    />,
  );
  // Competencias en la principal aunque su tipo sea de lateral.
  const mainIdx = html.indexOf("cv-layout-main");
  expect(mainIdx).toBeGreaterThan(-1);
  expect(html.indexOf("Competencias")).toBeGreaterThan(mainIdx);
});

test("enérgica usa bloque de acento y píldoras con acento", () => {
  const html = renderToStaticMarkup(
    <TemplateRenderer
      content={content}
      design={{ ...design, templateId: "energetic" }}
      layout={layout}
      mode="preview"
    />,
  );
  expect(html).toContain("cv-energetic");
  expect(html).toContain("cv-pills");
  expect(html).toContain("#b91c1c");
});

test("la foto aparece en modernas y se omite en ATS", () => {
  const url = "https://fotos.example/retrato.jpg";
  const modern = renderToStaticMarkup(
    <TemplateRenderer
      content={content}
      design={{ ...design, templateId: "modern" }}
      layout={layout}
      mode="preview"
      photoUrl={url}
    />,
  );
  expect(modern).toContain("cv-photo");
  expect(modern).toContain(url);
  for (const id of ["sidebar", "elegant", "compact", "energetic"]) {
    const html = renderToStaticMarkup(
      <TemplateRenderer
        content={content}
        design={{ ...design, templateId: id }}
        layout={layout}
        mode="preview"
        photoUrl={url}
      />,
    );
    expect(html, `${id} muestra la foto`).toContain("cv-photo");
  }
  for (const id of ["classic", "minimal", "technical"]) {
    const html = renderToStaticMarkup(
      <TemplateRenderer
        content={content}
        design={{ ...design, templateId: id }}
        layout={layout}
        mode="preview"
        photoUrl={url}
      />,
    );
    expect(html, `${id} omite la foto (ATS)`).not.toContain("cv-photo");
  }
  const sinFoto = renderToStaticMarkup(
    <TemplateRenderer
      content={content}
      design={{ ...design, templateId: "modern" }}
      layout={layout}
      mode="preview"
    />,
  );
  expect(sinFoto).not.toContain("cv-photo");
});

test("técnica usa línea de tiempo, barras y secciones numeradas", () => {
  const html = renderToStaticMarkup(
    <TemplateRenderer
      content={content}
      design={{ ...design, templateId: "technical" }}
      layout={layout}
      mode="preview"
    />,
  );
  expect(html).toContain("cv-technical");
  expect(html).toContain("01");
  expect(html).toContain("5/5");
  expect(html).toContain("#b91c1c");
});

test("docRootStyle centraliza tipografía, relleno e interlineado", () => {
  const style = docRootStyle({
    ...design,
    lineHeight: 1.6,
    headingSize: "large",
  }) as Record<string, unknown>;
  expect(style.fontFamily).toContain("Georgia");
  expect(style.padding).toBe("13mm");
  expect(style.lineHeight).toBe(1.6);
  expect(style["--cv-leading"]).toBe("1.6");
  expect(style["--cv-heading"]).toBe("1.15");
});

test("twoColColumns reparte el ancho lateral a cada lado", () => {
  expect(twoColColumns("right", 33)).toBe("67fr 33fr");
  expect(twoColColumns("left", 25)).toBe("25fr 75fr");
});

test("el ancho lateral y las variables viajan en el HTML", () => {
  const html = renderToStaticMarkup(
    <TemplateRenderer
      content={content}
      design={{
        ...design,
        templateId: "classic",
        layoutId: "two-col",
        sidebarWidth: 30,
        headingSize: "compact",
      }}
      layout={layout}
      mode="preview"
    />,
  );
  expect(html).toContain("70fr 30fr");
  expect(html).toContain("--cv-heading:0.9");
  expect(html).toContain("--cv-leading:1.5");
});
