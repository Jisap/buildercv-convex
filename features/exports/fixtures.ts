import type { ResumeContent, ResumeDesign } from "@/types/resume";

// Fixtures para pruebas de PDF (Fase 5): corto (1 página), largo (varias),
// casos límite (nombres largos, acentos, listas extensas, personalizada).

export const SHORT_DESIGN: ResumeDesign = {
  templateId: "classic",
  templateVersion: 1,
  accentColor: "#1d4ed8",
  fontFamily: "inter",
};

export const SHORT_CONTENT: ResumeContent = {
  sections: [
    {
      id: "s1",
      type: "personal",
      title: "Datos personales",
      order: 0,
      visible: true,
      items: [
        {
          id: "p1",
          fullName: "Ana Ruiz",
          email: "ana@example.es",
          location: "Madrid",
        },
      ],
    },
    {
      id: "s2",
      type: "experience",
      title: "Experiencia",
      order: 1,
      visible: true,
      items: [
        {
          id: "e1",
          position: "Técnica",
          company: "Acme",
          startDate: "2022-01",
          current: true,
          description: "Soporte y mantenimiento.",
        },
      ],
    },
  ],
};

const LONG_TEXT =
  "Lideré la migración completa de la plataforma a una arquitectura " +
  "modular, coordinando a tres equipos durante dieciocho meses y reduciendo " +
  "los tiempos de despliegue de días a minutos. Implanté observabilidad de " +
  "extremo a extremo, con tableros, alertas y runbooks que bajaron un 60% " +
  "los incidentes en horario nocturno. Además mentoricé a cinco personas.";

function longExperience(id: string, company: string) {
  return {
    id,
    position: "Responsable de ingeniería de software con un nombre largo",
    company,
    location: "Barcelona, España",
    startDate: "2015-06",
    endDate: "2024-11",
    description: LONG_TEXT,
  };
}

export const LONG_CONTENT: ResumeContent = {
  sections: [
    {
      id: "s1",
      type: "personal",
      title: "Datos personales",
      order: 0,
      visible: true,
      items: [
        {
          id: "p1",
          fullName: "José María Ñíguez Fernández de la Cotera y Aldama",
          email: "jose.maria.niguez@example.es",
          phone: "+34 600 123 456",
          location: "A Coruña, Galicia, España",
          links: [
            { id: "l1", label: "LinkedIn", url: "https://linkedin.example/jose" },
            { id: "l2", label: "Portafolio", url: "https://portfolio.example/jose" },
          ],
        },
      ],
    },
    {
      id: "s2",
      type: "profile",
      title: "Perfil profesional",
      order: 1,
      visible: true,
      items: [{ id: "pr1", text: `${LONG_TEXT} ${LONG_TEXT}` }],
    },
    {
      id: "s3",
      type: "experience",
      title: "Experiencia",
      order: 2,
      visible: true,
      items: [
        {
          ...longExperience("e1", "Empresa Alfa S.L."),
          endDate: undefined,
          current: true,
        },
        longExperience("e2", "Empresa Beta S.A."),
        longExperience("e3", "Empresa Gamma S.Coop."),
        longExperience("e4", "Empresa Delta S.L."),
        longExperience("e5", "Empresa Épsilon S.A."),
      ],
    },
    {
      id: "s4",
      type: "education",
      title: "Formación",
      order: 3,
      visible: true,
      items: [
        {
          id: "ed1",
          school: "Universidad Politécnica",
          degree: "Ingeniería",
          field: "Informática",
          startDate: "2008-09",
          endDate: "2014-06",
          description: LONG_TEXT,
        },
      ],
    },
    {
      id: "s5",
      type: "skills",
      title: "Competencias",
      order: 4,
      visible: true,
      items: Array.from({ length: 15 }, (_, i) => ({
        id: `sk${i}`,
        name: `Competencia número ${i + 1}`,
        level: ((i % 5) + 1) as number,
      })),
    },
    {
      id: "s6",
      type: "languages",
      title: "Idiomas",
      order: 5,
      visible: true,
      items: [
        { id: "lg1", name: "Español", level: "Nativo" },
        { id: "lg2", name: "Inglés", level: "C1" },
        { id: "lg3", name: "Gallego", level: "C2" },
      ],
    },
    {
      id: "s7",
      type: "custom",
      title: "Publicaciones y charlas",
      order: 6,
      visible: true,
      items: [
        { id: "c1", title: "Charla: diseño para todos", description: LONG_TEXT },
        { id: "c2", title: "Artículo: accesibilidad", description: LONG_TEXT },
      ],
    },
  ],
};
