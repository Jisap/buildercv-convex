import type {
  CustomItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  PersonalItem,
  ProfileItem,
  ProjectItem,
  SkillItem,
} from "@/types/resume";
import { FONT_STACKS, type ResumeTemplateProps } from "./types";
import { formatRange, visibleSections, SectionTitle } from "./shared";

// Clásico / ATS: una columna, jerarquía clara, acento solo en nombre y
// filetes. Nada decorativo que dificulte la lectura automática.

export function ClassicTemplate({ content, design, mode }: ResumeTemplateProps) {
  const sections = visibleSections(content);
  const personal = sections.find((s) => s.type === "personal");
  const rest = sections.filter((s) => s !== personal);
  const person = personal?.type === "personal" ? personal.items[0] : undefined;

  return (
    <article
      aria-label="Currículum"
      style={{ fontFamily: FONT_STACKS[design.fontFamily] }}
      className={
        mode === "print"
          ? "bg-white p-8 text-zinc-900"
          : "rounded-xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm"
      }
    >
      {person && <ClassicPersonal item={person} accent={design.accentColor} />}
      <div className="mt-5 space-y-5">
        {rest.map((section) => (
          <section key={section.id} aria-label={section.title}>
            <SectionTitle className="border-b border-zinc-300 pb-1 text-xs font-bold tracking-widest text-zinc-900 uppercase">
              {section.title}
            </SectionTitle>
            <div className="mt-2">
              <ClassicBody sectionType={section.type} items={section.items} />
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

function ClassicPersonal({ item, accent }: { item: PersonalItem; accent: string }) {
  return (
    <header>
      <h2 className="text-3xl font-bold" style={{ color: accent }}>
        {item.fullName || "Tu nombre"}
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        {[item.email, item.phone, item.location].filter(Boolean).join(" · ")}
      </p>
      {item.links && item.links.length > 0 && (
        <p className="mt-1 text-sm text-zinc-600">
          {item.links.map((l) => l.label || l.url || "").filter(Boolean).join(" · ")}
        </p>
      )}
    </header>
  );
}

function ClassicBody({
  sectionType,
  items,
}: {
  sectionType: string;
  items: ProfileItem[] | ExperienceItem[] | EducationItem[] | SkillItem[] | LanguageItem[] | ProjectItem[] | CustomItem[] | PersonalItem[];
}) {
  if (sectionType === "profile") {
    return (
      <div className="space-y-2">
        {(items as ProfileItem[]).map((item) => (
          <p key={item.id} className="whitespace-pre-line text-sm leading-6 text-zinc-800">
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
          <li key={item.id}>
            <p className="text-sm font-bold text-zinc-900">
              {item.position || "Puesto"}
              {item.company ? ` — ${item.company}` : ""}
            </p>
            <p className="text-sm text-zinc-500">
              {[item.location, formatRange(item.startDate, item.endDate, item.current)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.description && (
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-800">
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
            <p className="text-sm text-zinc-500">
              {[item.school, formatRange(item.startDate, item.endDate)].filter(Boolean).join(" · ")}
            </p>
            {item.description && (
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-800">
                {item.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "skills" || sectionType === "digitalSkills") {
    return (
      <p className="text-sm leading-6 text-zinc-800">
        {(items as SkillItem[])
          .map((i) => i.name || "")
          .filter(Boolean)
          .join(" · ")}
      </p>
    );
  }
  if (sectionType === "languages") {
    return (
      <ul className="space-y-1 text-sm text-zinc-800">
        {(items as LanguageItem[]).map((item) => (
          <li key={item.id}>
            {item.name || "—"}
            {item.level ? ` — ${item.level}` : ""}
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
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-800">
                {item.description}
              </p>
            )}
            <p className="text-sm text-zinc-500">
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
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-800">
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
