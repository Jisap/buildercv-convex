import type {
  EducationItem,
  ExperienceItem,
  LanguageItem,
  PersonalItem,
  ProfileItem,
  ProjectItem,
  CustomItem,
  SkillItem,
} from "@/types/resume";
import { FONT_STACKS, type ResumeTemplateProps } from "./types";
import { formatRange, visibleSections, SectionTitle } from "./shared";

// Moderno: cabecera con banda de acento y títulos de sección en acento.
// Misma estructura y contenido que el resto de plantillas.

export function ModernTemplate({ content, design, mode }: ResumeTemplateProps) {
  const sections = visibleSections(content);
  const personal = sections.find((s) => s.type === "personal");
  const rest = sections.filter((s) => s !== personal);
  const person = personal?.type === "personal" ? personal.items[0] : undefined;
  const accent = design.accentColor;

  return (
    <article
      aria-label="Currículum"
      style={{ fontFamily: FONT_STACKS[design.fontFamily] }}
      className={
        mode === "print"
          ? "bg-white text-zinc-900"
          : "overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm"
      }
    >
      <div className="p-8 text-white" style={{ backgroundColor: accent }}>
        {person ? (
          <ModernPersonal item={person} />
        ) : (
          <h2 className="text-3xl font-bold">Tu nombre</h2>
        )}
      </div>
      <div className="space-y-5 p-8">
        {rest.map((section) => (
          <section key={section.id} aria-label={section.title}>
            <SectionTitle
              className="text-sm font-bold tracking-wide uppercase"
            >
              <span style={{ color: accent }}>{section.title}</span>
            </SectionTitle>
            <div
              className="mt-1 mb-2 h-0.5 w-10"
              style={{ backgroundColor: accent }}
              aria-hidden
            />
            <ModernBody sectionType={section.type} items={section.items} accent={accent} />
          </section>
        ))}
      </div>
    </article>
  );
}

function ModernPersonal({ item }: { item: PersonalItem }) {
  return (
    <header>
      <h2 className="text-3xl font-bold text-white">{item.fullName || "Tu nombre"}</h2>
      <p className="mt-1 text-sm text-white/90">
        {[item.email, item.phone, item.location].filter(Boolean).join(" · ")}
      </p>
      {item.links && item.links.length > 0 && (
        <p className="mt-1 text-sm text-white/90">
          {item.links.map((l) => l.label || l.url || "").filter(Boolean).join(" · ")}
        </p>
      )}
    </header>
  );
}

function ModernBody({
  sectionType,
  items,
  accent,
}: {
  sectionType: string;
  items: ProfileItem[] | ExperienceItem[] | EducationItem[] | SkillItem[] | LanguageItem[] | ProjectItem[] | CustomItem[] | PersonalItem[];
  accent: string;
}) {
  if (sectionType === "profile") {
    return (
      <div className="space-y-2">
        {(items as ProfileItem[]).map((item) => (
          <p key={item.id} className="text-sm leading-6 text-zinc-700">
            {item.text || ""}
          </p>
        ))}
      </div>
    );
  }
  if (sectionType === "experience") {
    return (
      <ul className="space-y-4">
        {(items as ExperienceItem[]).map((item) => (
          <li key={item.id} className="border-l-2 pl-3" style={{ borderColor: accent }}>
            <p className="text-sm font-bold text-zinc-900">
              {item.position || "Puesto"}
              {item.company ? ` · ${item.company}` : ""}
            </p>
            <p className="text-xs text-zinc-500">
              {[item.location, formatRange(item.startDate, item.endDate, item.current)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.description && (
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-700">
                {item.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "education") {
    return (
      <ul className="space-y-3">
        {(items as EducationItem[]).map((item) => (
          <li key={item.id}>
            <p className="text-sm font-bold text-zinc-900">
              {[item.degree, item.field].filter(Boolean).join(" · ") || "Titulación"}
            </p>
            <p className="text-xs text-zinc-500">
              {[item.school, formatRange(item.startDate, item.endDate)].filter(Boolean).join(" · ")}
            </p>
            {item.description && (
              <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{item.description}</p>
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "skills" || sectionType === "digitalSkills") {
    return (
      <ul className="flex flex-wrap gap-1.5">
        {(items as SkillItem[]).map((item) => (
          <li
            key={item.id}
            className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: accent }}
          >
            {item.name || "—"}
            {typeof item.level === "number" ? ` · ${item.level}/5` : ""}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "languages") {
    return (
      <ul className="space-y-1 text-sm text-zinc-700">
        {(items as LanguageItem[]).map((item) => (
          <li key={item.id}>
            <span className="font-semibold">{item.name || "—"}</span>
            {item.level ? ` · ${item.level}` : ""}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "projects") {
    return (
      <ul className="space-y-3">
        {(items as ProjectItem[]).map((item) => (
          <li key={item.id}>
            <p className="text-sm font-bold text-zinc-900">{item.name || "Proyecto"}</p>
            {item.description && (
              <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{item.description}</p>
            )}
            <p className="text-xs text-zinc-500">
              {[item.url, (item.technologies ?? []).join(", ")].filter(Boolean).join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="space-y-3">
      {(items as CustomItem[]).map((item) => (
        <li key={item.id}>
          {item.title && <p className="text-sm font-bold text-zinc-900">{item.title}</p>}
          {item.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{item.description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
