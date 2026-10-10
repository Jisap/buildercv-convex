"use client";

import type {
  CustomItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  PersonalItem,
  ProfileItem,
  ProjectItem,
  ResumeContent,
  ResumeSection,
  SkillItem,
} from "@/types/resume";

// Vista previa sencilla de Fase 3: mismo contenido estructurado, sin diseño
// de plantilla. Fase 4 la sustituye por los renderizadores del contrato
// ResumeTemplateProps manteniendo esta semántica.

function formatRange(
  start?: string,
  end?: string,
  current?: boolean,
): string | null {
  if (!start && !end && !current) {
    return null;
  }
  const fmt = (d: string) => {
    const [y, m] = d.split("-");
    return `${m}/${y}`;
  };
  const left = start ? fmt(start) : "";
  const right = current ? "actualidad" : end ? fmt(end) : "";
  return `${left} – ${right}`.trim();
}

function PersonalBlock({ item }: { item: PersonalItem }) {
  return (
    <header>
      <h2 className="text-2xl font-bold text-zinc-950">
        {item.fullName || "Tu nombre"}
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        {[item.email, item.phone, item.location].filter(Boolean).join(" · ")}
      </p>
      {item.links && item.links.length > 0 && (
        <p className="mt-1 text-sm text-zinc-600">
          {item.links
            .map((l) => l.label || l.url || "")
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </header>
  );
}

function ExperienceBlock({ items }: { items: ExperienceItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <p className="font-semibold text-zinc-900">
            {item.position || "Puesto"}
            {item.company ? ` · ${item.company}` : ""}
          </p>
          <p className="text-sm text-zinc-500">
            {[item.location, formatRange(item.startDate, item.endDate, item.current)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {item.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function EducationBlock({ items }: { items: EducationItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <p className="font-semibold text-zinc-900">
            {[item.degree, item.field].filter(Boolean).join(" · ") || "Titulación"}
          </p>
          <p className="text-sm text-zinc-500">
            {[item.school, formatRange(item.startDate, item.endDate)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {item.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function SkillBlock({ items }: { items: SkillItem[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm text-zinc-800"
        >
          {item.name || "—"}
          {typeof item.level === "number" ? ` (${item.level}/5)` : ""}
        </li>
      ))}
    </ul>
  );
}

function LanguageBlock({ items }: { items: LanguageItem[] }) {
  return (
    <ul className="space-y-1 text-sm text-zinc-700">
      {items.map((item) => (
        <li key={item.id}>
          {item.name || "—"}
          {item.level ? ` · ${item.level}` : ""}
        </li>
      ))}
    </ul>
  );
}

function ProjectBlock({ items }: { items: ProjectItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <p className="font-semibold text-zinc-900">{item.name || "Proyecto"}</p>
          {item.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">
              {item.description}
            </p>
          )}
          <p className="text-sm text-zinc-500">
            {[
              item.url,
              item.technologies && item.technologies.length > 0
                ? item.technologies.join(", ")
                : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}

function CustomBlock({ items }: { items: CustomItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          {item.title && <p className="font-semibold text-zinc-900">{item.title}</p>}
          {item.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function SectionBody({ section }: { section: ResumeSection }) {
  switch (section.type) {
    case "personal":
      return section.items[0] ? <PersonalBlock item={section.items[0]} /> : null;
    case "profile":
      return (
        <div className="space-y-2">
          {(section.items as ProfileItem[]).map((item) => (
            <p key={item.id} className="whitespace-pre-line text-sm text-zinc-700">
              {item.text || ""}
            </p>
          ))}
        </div>
      );
    case "experience":
      return <ExperienceBlock items={section.items} />;
    case "education":
      return <EducationBlock items={section.items} />;
    case "skills":
    case "digitalSkills":
      return <SkillBlock items={section.items} />;
    case "languages":
      return <LanguageBlock items={section.items} />;
    case "projects":
      return <ProjectBlock items={section.items} />;
    case "custom":
      return <CustomBlock items={section.items} />;
  }
}

export function ResumePreview({
  title,
  content,
}: {
  title: string;
  content: ResumeContent;
}) {
  const visible = [...content.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);
  const personal = visible.find((s) => s.type === "personal");
  const rest = visible.filter((s) => s !== personal);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
      <p className="mb-4 text-xs text-zinc-400">
        Vista previa · {title || "Sin título"}
      </p>
      {personal ? <SectionBody section={personal} /> : null}
      <div className="mt-4 space-y-5">
        {rest.map((s) => (
            <section key={s.id} aria-label={s.title}>
              <h3 className="border-b border-zinc-200 pb-1 text-sm font-bold tracking-wide text-zinc-900 uppercase">
                {s.title}
              </h3>
              <div className="mt-2">
                <SectionBody section={s} />
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
