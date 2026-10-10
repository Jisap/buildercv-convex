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

// Compacto profesional: densidad alta, texto algo menor y dos columnas para
// listas cortas (competencias e idiomas). Mismo contenido, más CV por página.

export function CompactTemplate({ content, design, mode }: ResumeTemplateProps) {
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
          ? "bg-white p-6 text-[13px] leading-5 text-zinc-900"
          : "rounded-xl border border-zinc-200 bg-white p-6 text-[13px] leading-5 text-zinc-900 shadow-sm"
      }
    >
      {person && <CompactPersonal item={person} accent={design.accentColor} />}
      <div className="mt-3 space-y-3">
        {rest.map((section) => {
          const twoCol =
            section.type === "skills" ||
            section.type === "digitalSkills" ||
            section.type === "languages";
          return (
            <section key={section.id} aria-label={section.title}>
              <SectionTitle className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                {section.title}
              </SectionTitle>
              <div className={twoCol ? "mt-1 grid grid-cols-1 gap-x-6 sm:grid-cols-2" : "mt-1"}>
                <CompactBody sectionType={section.type} items={section.items} />
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}

function CompactPersonal({ item, accent }: { item: PersonalItem; accent: string }) {
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 pb-2" style={{ borderColor: accent }}>
      <h2 className="text-xl font-bold text-zinc-950">{item.fullName || "Tu nombre"}</h2>
      <p className="text-xs text-zinc-600">
        {[item.email, item.phone, item.location].filter(Boolean).join(" · ")}
        {item.links && item.links.length > 0
          ? ` · ${item.links.map((l) => l.label || l.url || "").filter(Boolean).join(" · ")}`
          : ""}
      </p>
    </header>
  );
}

function CompactBody({
  sectionType,
  items,
}: {
  sectionType: string;
  items: ProfileItem[] | ExperienceItem[] | EducationItem[] | SkillItem[] | LanguageItem[] | ProjectItem[] | CustomItem[] | PersonalItem[];
}) {
  if (sectionType === "profile") {
    return (
      <>
        {(items as ProfileItem[]).map((item) => (
          <p key={item.id} className="text-zinc-700">
            {item.text || ""}
          </p>
        ))}
      </>
    );
  }
  if (sectionType === "experience") {
    return (
      <ul className="space-y-2">
        {(items as ExperienceItem[]).map((item) => (
          <li key={item.id}>
            <p className="font-bold text-zinc-900">
              {item.position || "Puesto"}
              {item.company ? ` · ${item.company}` : ""}
              <span className="ml-2 font-normal text-zinc-500">
                {formatRange(item.startDate, item.endDate, item.current) ?? ""}
                {item.location ? ` · ${item.location}` : ""}
              </span>
            </p>
            {item.description && (
              <p className="whitespace-pre-line text-zinc-700">{item.description}</p>
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "education") {
    return (
      <ul className="space-y-1.5">
        {(items as EducationItem[]).map((item) => (
          <li key={item.id}>
            <p className="font-bold text-zinc-900">
              {[item.degree, item.field].filter(Boolean).join(" · ") || "Titulación"}
              <span className="ml-2 font-normal text-zinc-500">
                {[item.school, formatRange(item.startDate, item.endDate)].filter(Boolean).join(" · ")}
              </span>
            </p>
            {item.description && <p className="text-zinc-700">{item.description}</p>}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "skills" || sectionType === "digitalSkills") {
    return (
      <ul className="space-y-0.5 text-zinc-700">
        {(items as SkillItem[]).map((item) => (
          <li key={item.id}>
            {item.name || "—"}
            {typeof item.level === "number" ? ` (${item.level}/5)` : ""}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "languages") {
    return (
      <ul className="space-y-0.5 text-zinc-700">
        {(items as LanguageItem[]).map((item) => (
          <li key={item.id}>
            {item.name || "—"}
            {item.level ? ` · ${item.level}` : ""}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "projects") {
    return (
      <ul className="space-y-2">
        {(items as ProjectItem[]).map((item) => (
          <li key={item.id}>
            <p className="font-bold text-zinc-900">
              {item.name || "Proyecto"}
              <span className="ml-2 font-normal text-zinc-500">
                {[item.url, (item.technologies ?? []).join(", ")].filter(Boolean).join(" · ")}
              </span>
            </p>
            {item.description && <p className="text-zinc-700">{item.description}</p>}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="space-y-1.5">
      {(items as CustomItem[]).map((item) => (
        <li key={item.id}>
          {item.title && <p className="font-bold text-zinc-900">{item.title}</p>}
          {item.description && <p className="text-zinc-700">{item.description}</p>}
        </li>
      ))}
    </ul>
  );
}
