import type {
  EducationItem,
  ExperienceItem,
  LanguageItem,
  PersonalItem,
  ProfileItem,
  ProjectItem,
  CustomItem,
  ResumeSection,
  SkillItem,
} from "@/types/resume";
import { FONT_STACKS, type ResumeTemplateProps } from "./types";
import { formatRange, SectionTitle } from "./shared";
import { partitionForLayout } from "./layout";

// Moderno: cabecera con banda de acento y títulos de sección en acento.
// Misma estructura y contenido que el resto de plantillas.
// Clases `cv-*`: ganchos semánticos para el CSS de impresión (Fase 5).

export function ModernTemplate({ content, design, layout, mode }: ResumeTemplateProps) {
  const { personal, main, sidebar } = partitionForLayout(
    content.sections,
    design.layoutId,
    layout,
  );
  const person = personal?.type === "personal" ? personal.items[0] : undefined;
  const accent = design.accentColor;
  const twoCol = design.layoutId === "two-col" && sidebar.length > 0;
  const gap = `${design.sectionSpacing}mm`;

  return (
    <article
      aria-label="Currículum"
      style={{
        fontFamily: FONT_STACKS[design.fontFamily],
        padding: `${design.pageMargin}mm`,
      }}
      className={
        mode === "print"
          ? "cv-doc bg-white text-zinc-900"
          : "cv-doc overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm"
      }
    >
      <div className="cv-band p-8 text-white" style={{ backgroundColor: accent }}>
        {person ? (
          <ModernPersonal item={person} />
        ) : (
          <h2 className="cv-name text-3xl font-bold">Tu nombre</h2>
        )}
      </div>
      {twoCol ? (
        <div
          className="cv-layout-two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            columnGap: "8mm",
            marginTop: gap,
          }}
        >
          <div
            className="cv-layout-main"
            style={{ display: "grid", gap, alignContent: "start" }}
          >
            {main.map((section) => (
              <ModernSection key={section.id} section={section} accent={accent} />
            ))}
          </div>
          <div
            className="cv-layout-sidebar"
            style={{ display: "grid", gap, alignContent: "start" }}
          >
            {sidebar.map((section) => (
              <ModernSection key={section.id} section={section} accent={accent} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="cv-sections"
          style={{ display: "grid", gap, marginTop: gap }}
        >
          {main.map((section) => (
            <ModernSection key={section.id} section={section} accent={accent} />
          ))}
        </div>
      )}
    </article>
  );
}

function ModernSection({
  section,
  accent,
}: {
  section: ResumeSection;
  accent: string;
}) {
  return (
    <section aria-label={section.title} className="cv-section">
      <SectionTitle className="cv-section-title text-sm font-bold tracking-wide uppercase">
        <span style={{ color: accent }}>{section.title}</span>
      </SectionTitle>
      <div
        className="cv-rule mt-1 mb-2 h-0.5 w-10"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <ModernBody sectionType={section.type} items={section.items} accent={accent} />
    </section>
  );
}

function ModernPersonal({ item }: { item: PersonalItem }) {
  return (
    <header className="cv-personal">
      <h2 className="cv-name text-3xl font-bold text-white">{item.fullName || "Tu nombre"}</h2>
      <p className="cv-contact mt-1 text-sm text-white/90">
        {[item.email, item.phone, item.location].filter(Boolean).join(" · ")}
      </p>
      {item.links && item.links.length > 0 && (
        <p className="cv-links mt-1 text-sm text-white/90">
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
          <p key={item.id} className="cv-entry-text text-sm leading-6 text-zinc-700">
            {item.text || ""}
          </p>
        ))}
      </div>
    );
  }
  if (sectionType === "experience") {
    return (
      <ul className="cv-entries space-y-4">
        {(items as ExperienceItem[]).map((item) => (
          <li key={item.id} className="cv-entry border-l-2 pl-3" style={{ borderColor: accent }}>
            <p className="cv-entry-title text-sm font-bold text-zinc-900">
              {item.position || "Puesto"}
              {item.company ? ` · ${item.company}` : ""}
            </p>
            <p className="cv-entry-meta text-xs text-zinc-500">
              {[item.location, formatRange(item.startDate, item.endDate, item.current)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.description && (
              <p className="cv-entry-text mt-1 whitespace-pre-line text-sm leading-6 text-zinc-700">
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
      <ul className="cv-entries space-y-3">
        {(items as EducationItem[]).map((item) => (
          <li key={item.id} className="cv-entry">
            <p className="cv-entry-title text-sm font-bold text-zinc-900">
              {[item.degree, item.field].filter(Boolean).join(" · ") || "Titulación"}
            </p>
            <p className="cv-entry-meta text-xs text-zinc-500">
              {[item.school, formatRange(item.startDate, item.endDate)].filter(Boolean).join(" · ")}
            </p>
            {item.description && (
              <p className="cv-entry-text mt-1 whitespace-pre-line text-sm text-zinc-700">{item.description}</p>
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "skills" || sectionType === "digitalSkills") {
    return (
      <ul className="cv-pills flex flex-wrap gap-1.5">
        {(items as SkillItem[]).map((item) => (
          <li
            key={item.id}
            className="cv-pill rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
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
      <ul className="cv-lang-list space-y-1 text-sm text-zinc-700">
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
      <ul className="cv-entries space-y-3">
        {(items as ProjectItem[]).map((item) => (
          <li key={item.id} className="cv-entry">
            <p className="cv-entry-title text-sm font-bold text-zinc-900">{item.name || "Proyecto"}</p>
            {item.description && (
              <p className="cv-entry-text mt-1 whitespace-pre-line text-sm text-zinc-700">{item.description}</p>
            )}
            <p className="cv-entry-meta text-xs text-zinc-500">
              {[item.url, (item.technologies ?? []).join(", ")].filter(Boolean).join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="cv-entries space-y-3">
      {(items as CustomItem[]).map((item) => (
        <li key={item.id} className="cv-entry">
          {item.title && <p className="cv-entry-title text-sm font-bold text-zinc-900">{item.title}</p>}
          {item.description && (
            <p className="cv-entry-text mt-1 whitespace-pre-line text-sm text-zinc-700">{item.description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
