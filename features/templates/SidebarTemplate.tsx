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
import { FONT_STACKS, type ResumeTemplateProps } from "./types";
import { formatRange, SectionTitle } from "./shared";
import { partitionForLayout } from "./layout";

// Lateral: banda lateral con el color de acento para las secciones
// compactas (competencias e idiomas); el resto en la principal.
// En una columna todo se apila con texto oscuro. El color de la banda
// viaja en estilos en línea para que llegue intacto al PDF.
// Clases `cv-*`: ganchos semánticos para el CSS de impresión.

export function SidebarTemplate({ content, design, layout, mode }: ResumeTemplateProps) {
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
          : "cv-doc rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm"
      }
    >
      {person && <SidebarPersonal item={person} accent={accent} />}
      {twoCol ? (
        <div
          className="cv-layout-two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            columnGap: "8mm",
            marginTop: gap,
          }}
        >
          <div
            className="cv-layout-main"
            style={{
              gridColumn: 2,
              display: "grid",
              gap,
              alignContent: "start",
            }}
          >
            {main.map((section) => (
              <SidebarSection key={section.id} section={section} />
            ))}
          </div>
          <aside
            className="cv-aside"
            aria-label="Información complementaria"
            style={{
              gridColumn: 1,
              gridRow: 1,
              backgroundColor: accent,
              color: "#fff",
              borderRadius: "2mm",
              padding: "5mm 4mm",
              display: "grid",
              gap,
              alignContent: "start",
            }}
          >
            {sidebar.map((section) => (
              <SidebarSection key={section.id} section={section} light />
            ))}
          </aside>
        </div>
      ) : (
        <div
          className="cv-sections"
          style={{ display: "grid", gap, marginTop: gap }}
        >
          {main.map((section) => (
            <SidebarSection key={section.id} section={section} />
          ))}
        </div>
      )}
    </article>
  );
}

function SidebarPersonal({ item, accent }: { item: PersonalItem; accent: string }) {
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

function SidebarSection({
  section,
  light = false,
}: {
  section: ResumeSection;
  light?: boolean;
}) {
  return (
    <section aria-label={section.title} className="cv-section">
      <SectionTitle
        className={`cv-section-title border-b pb-1 text-xs font-bold tracking-widest uppercase ${
          light
            ? "border-white/40 text-white"
            : "border-zinc-300 text-zinc-900"
        }`}
      >
        {section.title}
      </SectionTitle>
      <div className="mt-2">
        <SidebarBody
          sectionType={section.type}
          items={section.items}
          light={light}
        />
      </div>
    </section>
  );
}

function SidebarBody({
  sectionType,
  items,
  light,
}: {
  sectionType: string;
  items: ProfileItem[] | ExperienceItem[] | EducationItem[] | SkillItem[] | LanguageItem[] | ProjectItem[] | CustomItem[] | PersonalItem[];
  light: boolean;
}) {
  const text = light ? "text-white" : "text-zinc-800";
  const meta = light ? "text-white/85" : "text-zinc-500";
  const title = light ? "text-white" : "text-zinc-900";
  if (sectionType === "profile") {
    return (
      <div className="space-y-2">
        {(items as ProfileItem[]).map((item) => (
          <p key={item.id} className={`cv-entry-text whitespace-pre-line text-sm leading-6 ${text}`}>
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
            <p className={`cv-entry-title text-sm font-bold ${title}`}>
              {item.position || "Puesto"}
              {item.company ? ` — ${item.company}` : ""}
            </p>
            <p className={`cv-entry-meta text-sm ${meta}`}>
              {[item.location, formatRange(item.startDate, item.endDate, item.current)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.description && (
              <p className={`cv-entry-text mt-1 whitespace-pre-line text-sm leading-6 ${text}`}>
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
            <p className={`cv-entry-title text-sm font-bold ${title}`}>
              {[item.degree, item.field].filter(Boolean).join(" · ") || "Titulación"}
            </p>
            <p className={`cv-entry-meta text-sm ${meta}`}>
              {[item.school, formatRange(item.startDate, item.endDate)].filter(Boolean).join(" · ")}
            </p>
            {item.description && (
              <p className={`cv-entry-text mt-1 whitespace-pre-line text-sm leading-6 ${text}`}>
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
      <ul className={`cv-pills space-y-1 text-sm ${text}`}>
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
      <ul className={`cv-lang-list space-y-1 text-sm ${text}`}>
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
            <p className={`cv-entry-title text-sm font-bold ${title}`}>{item.name || "Proyecto"}</p>
            {item.description && (
              <p className={`cv-entry-text mt-1 whitespace-pre-line text-sm leading-6 ${text}`}>
                {item.description}
              </p>
            )}
            <p className={`cv-entry-meta text-sm ${meta}`}>
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
          {item.title && <p className={`cv-entry-title text-sm font-bold ${title}`}>{item.title}</p>}
          {item.description && (
            <p className={`cv-entry-text mt-1 whitespace-pre-line text-sm leading-6 ${text}`}>
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
