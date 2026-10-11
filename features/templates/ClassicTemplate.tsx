import type {
  CustomItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  PersonalItem,
  ProfileItem,
  ProjectItem,
  ResumeSection,
  SkillItem,
} from "@/types/resume";
import type { ResumeTemplateProps } from "./types";
import {
  docRootStyle,
  formatRange,
  SectionTitle,
  twoColColumns,
} from "./shared";
import { partitionForLayout } from "./layout";

// Clásico / ATS: una columna, jerarquía clara, acento solo en nombre y
// filetes. Nada decorativo que dificulte la lectura automática.
// Clases `cv-*`: ganchos semánticos para el CSS de impresión (Fase 5);
// no alteran el aspecto en pantalla.

export function ClassicTemplate({ content, design, layout, mode }: ResumeTemplateProps) {
  const { personal, main, sidebar } = partitionForLayout(
    content.sections,
    design.layoutId,
    layout,
  );
  const person = personal?.type === "personal" ? personal.items[0] : undefined;
  const twoCol = design.layoutId === "two-col" && sidebar.length > 0;
  const gap = `${design.sectionSpacing}mm`;

  return (
    <article
      aria-label="Currículum"
      style={docRootStyle(design)}
      className={
        mode === "print"
          ? "cv-doc bg-white text-zinc-900"
          : "cv-doc rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm"
      }
    >
      {person && <ClassicPersonal item={person} accent={design.accentColor} />}
      {twoCol ? (
        <div
          className="cv-layout-two-col"
          style={{
            display: "grid",
            gridTemplateColumns: twoColColumns("right", design.sidebarWidth),
            columnGap: "8mm",
            marginTop: gap,
          }}
        >
          <div
            className="cv-layout-main"
            style={{ display: "grid", gap, alignContent: "start" }}
          >
            {main.map((section) => (
              <ClassicSection key={section.id} section={section} />
            ))}
          </div>
          <div
            className="cv-layout-sidebar"
            style={{ display: "grid", gap, alignContent: "start" }}
          >
            {sidebar.map((section) => (
              <ClassicSection key={section.id} section={section} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="cv-sections"
          style={{ display: "grid", gap, marginTop: gap }}
        >
          {main.map((section) => (
            <ClassicSection key={section.id} section={section} />
          ))}
        </div>
      )}
    </article>
  );
}

function ClassicSection({ section }: { section: ResumeSection }) {
  return (
    <section aria-label={section.title} className="cv-section">
      <SectionTitle className="cv-section-title border-b border-zinc-300 pb-1 text-xs font-bold tracking-widest text-zinc-900 uppercase">
        {section.title}
      </SectionTitle>
      <div className="mt-2">
        <ClassicBody sectionType={section.type} items={section.items} />
      </div>
    </section>
  );
}

function ClassicPersonal({ item, accent }: { item: PersonalItem; accent: string }) {
  // Sin foto a propósito: plantilla de lectura automática (ATS).
  return (
    <header className="cv-personal">
      <h2 className="cv-name text-3xl font-bold" style={{ color: accent }}>
        {item.fullName || "Tu nombre"}
      </h2>
      <p className="cv-contact mt-1 text-sm text-zinc-600">
        {[item.email, item.phone, item.location].filter(Boolean).join(" · ")}
      </p>
      {item.links && item.links.length > 0 && (
        <p className="cv-links mt-1 text-sm text-zinc-600">
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
          <p key={item.id} className="cv-entry-text whitespace-pre-line text-sm leading-6 text-zinc-800">
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
          <li key={item.id} className="cv-entry">
            <p className="cv-entry-title text-sm font-bold text-zinc-900">
              {item.position || "Puesto"}
              {item.company ? ` — ${item.company}` : ""}
            </p>
            <p className="cv-entry-meta text-sm text-zinc-500">
              {[item.location, formatRange(item.startDate, item.endDate, item.current)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.description && (
              <p className="cv-entry-text mt-1 whitespace-pre-line text-sm leading-6 text-zinc-800">
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
            <p className="cv-entry-meta text-sm text-zinc-500">
              {[item.school, formatRange(item.startDate, item.endDate)].filter(Boolean).join(" · ")}
            </p>
            {item.description && (
              <p className="cv-entry-text mt-1 whitespace-pre-line text-sm leading-6 text-zinc-800">
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
      <p className="cv-inline-list text-sm leading-6 text-zinc-800">
        {(items as SkillItem[])
          .map((i) => i.name || "")
          .filter(Boolean)
          .join(" · ")}
      </p>
    );
  }
  if (sectionType === "languages") {
    return (
      <ul className="cv-lang-list space-y-1 text-sm text-zinc-800">
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
      <ul className="cv-entries space-y-3">
        {(items as ProjectItem[]).map((item) => (
          <li key={item.id} className="cv-entry">
            <p className="cv-entry-title text-sm font-bold text-zinc-900">{item.name || "Proyecto"}</p>
            {item.description && (
              <p className="cv-entry-text mt-1 whitespace-pre-line text-sm leading-6 text-zinc-800">
                {item.description}
              </p>
            )}
            <p className="cv-entry-meta text-sm text-zinc-500">
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
            <p className="cv-entry-text mt-1 whitespace-pre-line text-sm leading-6 text-zinc-800">
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
