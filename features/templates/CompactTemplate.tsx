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

// Compacto profesional: densidad alta, texto algo menor y dos columnas para
// listas cortas (competencias e idiomas). Mismo contenido, más CV por página.
// Clases `cv-*`: ganchos semánticos para el CSS de impresión (Fase 5).

export function CompactTemplate({ content, design, layout, mode }: ResumeTemplateProps) {
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
      style={{
        fontFamily: FONT_STACKS[design.fontFamily],
        padding: `${design.pageMargin}mm`,
      }}
      className={
        mode === "print"
          ? "cv-doc bg-white text-[13px] leading-5 text-zinc-900"
          : "cv-doc rounded-xl border border-zinc-200 bg-white text-[13px] leading-5 text-zinc-900 shadow-sm"
      }
    >
      {person && <CompactPersonal item={person} accent={design.accentColor} />}
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
              <CompactSection key={section.id} section={section} />
            ))}
          </div>
          <div
            className="cv-layout-sidebar"
            style={{ display: "grid", gap, alignContent: "start" }}
          >
            {sidebar.map((section) => (
              <CompactSection key={section.id} section={section} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="cv-sections"
          style={{ display: "grid", gap, marginTop: gap }}
        >
          {main.map((section) => (
            <CompactSection key={section.id} section={section} />
          ))}
        </div>
      )}
    </article>
  );
}

function CompactSection({ section }: { section: ResumeSection }) {
  const twoColList =
    section.type === "skills" ||
    section.type === "digitalSkills" ||
    section.type === "languages";
  return (
    <section aria-label={section.title} className="cv-section">
      <SectionTitle className="cv-section-title text-xs font-bold tracking-widest text-zinc-500 uppercase">
        {section.title}
      </SectionTitle>
      <div className={twoColList ? "cv-cols mt-1 grid grid-cols-1 gap-x-6 sm:grid-cols-2" : "mt-1"}>
        <CompactBody sectionType={section.type} items={section.items} />
      </div>
    </section>
  );
}

function CompactPersonal({ item, accent }: { item: PersonalItem; accent: string }) {
  return (
    <header className="cv-personal flex flex-wrap items-baseline justify-between gap-2 border-b-2 pb-2" style={{ borderColor: accent }}>
      <h2 className="cv-name text-xl font-bold text-zinc-950">{item.fullName || "Tu nombre"}</h2>
      <p className="cv-contact text-xs text-zinc-600">
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
          <p key={item.id} className="cv-entry-text text-zinc-700">
            {item.text || ""}
          </p>
        ))}
      </>
    );
  }
  if (sectionType === "experience") {
    return (
      <ul className="cv-entries space-y-2">
        {(items as ExperienceItem[]).map((item) => (
          <li key={item.id} className="cv-entry">
            <p className="cv-entry-title font-bold text-zinc-900">
              {item.position || "Puesto"}
              {item.company ? ` · ${item.company}` : ""}
              <span className="cv-entry-meta ml-2 font-normal text-zinc-500">
                {formatRange(item.startDate, item.endDate, item.current) ?? ""}
                {item.location ? ` · ${item.location}` : ""}
              </span>
            </p>
            {item.description && (
              <p className="cv-entry-text whitespace-pre-line text-zinc-700">{item.description}</p>
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "education") {
    return (
      <ul className="cv-entries space-y-1.5">
        {(items as EducationItem[]).map((item) => (
          <li key={item.id} className="cv-entry">
            <p className="cv-entry-title font-bold text-zinc-900">
              {[item.degree, item.field].filter(Boolean).join(" · ") || "Titulación"}
              <span className="cv-entry-meta ml-2 font-normal text-zinc-500">
                {[item.school, formatRange(item.startDate, item.endDate)].filter(Boolean).join(" · ")}
              </span>
            </p>
            {item.description && <p className="cv-entry-text text-zinc-700">{item.description}</p>}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "skills" || sectionType === "digitalSkills") {
    return (
      <ul className="cv-pills space-y-0.5 text-zinc-700">
        {(items as SkillItem[]).map((item) => (
          <li key={item.id} className="cv-pill">
            {item.name || "—"}
            {typeof item.level === "number" ? ` (${item.level}/5)` : ""}
          </li>
        ))}
      </ul>
    );
  }
  if (sectionType === "languages") {
    return (
      <ul className="cv-lang-list space-y-0.5 text-zinc-700">
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
      <ul className="cv-entries space-y-2">
        {(items as ProjectItem[]).map((item) => (
          <li key={item.id} className="cv-entry">
            <p className="cv-entry-title font-bold text-zinc-900">
              {item.name || "Proyecto"}
              <span className="cv-entry-meta ml-2 font-normal text-zinc-500">
                {[item.url, (item.technologies ?? []).join(", ")].filter(Boolean).join(" · ")}
              </span>
            </p>
            {item.description && <p className="cv-entry-text text-zinc-700">{item.description}</p>}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="cv-entries space-y-1.5">
      {(items as CustomItem[]).map((item) => (
        <li key={item.id} className="cv-entry">
          {item.title && <p className="cv-entry-title font-bold text-zinc-900">{item.title}</p>}
          {item.description && <p className="cv-entry-text text-zinc-700">{item.description}</p>}
        </li>
      ))}
    </ul>
  );
}
