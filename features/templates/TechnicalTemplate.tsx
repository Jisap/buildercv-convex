import type { ReactNode } from "react";
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

// Técnica: perfiles de ingeniería e IT. Experiencia y formación en línea
// de tiempo con puntos de acento, competencias con barras de nivel (con
// texto del nivel para no perder información), y fechas y contacto en
// monoespaciada. Sin foto por diseño (como las ATS).
// Estructura en estilos en línea (viajan al PDF); Tailwind solo pule la
// vista previa. Clases `cv-*`: ganchos semánticos para el CSS de impresión.

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export function TechnicalTemplate({ content, design, layout, mode }: ResumeTemplateProps) {
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
      style={docRootStyle(design)}
      className={
        mode === "print"
          ? "cv-doc cv-technical bg-white text-zinc-900"
          : "cv-doc cv-technical rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm"
      }
    >
      {person ? (
        <TechnicalPersonal item={person} accent={accent} />
      ) : (
        <header className="cv-personal">
          <h2 className="cv-name text-3xl font-bold tracking-tight text-zinc-950">
            Tu nombre
          </h2>
          <div aria-hidden style={{ height: "0.8mm", backgroundColor: accent, marginTop: "2mm" }} />
        </header>
      )}
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
            {main.map((section, i) => (
              <TechnicalSection key={section.id} section={section} accent={accent} index={i} />
            ))}
          </div>
          <div
            className="cv-layout-sidebar"
            style={{ display: "grid", gap, alignContent: "start" }}
          >
            {sidebar.map((section, i) => (
              <TechnicalSection key={section.id} section={section} accent={accent} index={main.length + i} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="cv-sections"
          style={{ display: "grid", gap, marginTop: gap }}
        >
          {main.map((section, i) => (
            <TechnicalSection key={section.id} section={section} accent={accent} index={i} />
          ))}
        </div>
      )}
    </article>
  );
}

function TechnicalPersonal({
  item,
  accent,
}: {
  item: PersonalItem;
  accent: string;
}) {
  return (
    <header className="cv-personal">
      <h2 className="cv-name text-3xl font-bold tracking-tight text-zinc-950">
        {item.fullName || "Tu nombre"}
      </h2>
      <p className="cv-contact mt-1 text-sm text-zinc-600" style={{ fontFamily: MONO }}>
        {[item.email, item.phone, item.location].filter(Boolean).join("  //  ")}
      </p>
      {item.links && item.links.length > 0 && (
        <p className="cv-links mt-1 text-sm text-zinc-600" style={{ fontFamily: MONO }}>
          {item.links.map((l) => l.label || l.url || "").filter(Boolean).join("  //  ")}
        </p>
      )}
      <div aria-hidden style={{ height: "0.8mm", backgroundColor: accent, marginTop: "2mm" }} />
    </header>
  );
}

function TechnicalSection({
  section,
  accent,
  index,
}: {
  section: ResumeSection;
  accent: string;
  index: number;
}) {
  return (
    <section aria-label={section.title} className="cv-section">
      <SectionTitle className="cv-section-title text-sm font-bold tracking-wide text-zinc-900 uppercase">
        <span style={{ fontFamily: MONO, color: accent, marginRight: "2mm" }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        {section.title}
      </SectionTitle>
      <div className="mt-2">
        <TechnicalBody sectionType={section.type} items={section.items} accent={accent} />
      </div>
    </section>
  );
}

/** Entrada sobre la línea de tiempo (punto + hilo en estilos en línea). */
function TimelineEntry({
  accent,
  isLast,
  children,
}: {
  accent: string;
  isLast: boolean;
  children: ReactNode;
}) {
  return (
    <li className="cv-entry" style={{ display: "flex", gap: "3mm" }}>
      <div aria-hidden style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span
          style={{
            width: "2.5mm",
            height: "2.5mm",
            borderRadius: "50%",
            backgroundColor: accent,
            marginTop: "1.5mm",
            flexShrink: 0,
          }}
        />
        {!isLast && (
          <span style={{ flex: 1, width: "0.5mm", backgroundColor: "#d4d4d8" }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </li>
  );
}

function TechnicalBody({
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
            <span style={{ fontFamily: MONO, color: accent }}>&gt; </span>
            {item.text || ""}
          </p>
        ))}
      </div>
    );
  }
  if (sectionType === "experience") {
    const list = items as ExperienceItem[];
    return (
      <ul className="cv-entries space-y-4">
        {list.map((item, i) => (
          <TimelineEntry key={item.id} accent={accent} isLast={i === list.length - 1}>
            <p className="cv-entry-title text-sm font-bold text-zinc-900">
              {item.position || "Puesto"}
            </p>
            <p className="cv-entry-meta text-xs" style={{ fontFamily: MONO }}>
              {[item.company, item.location].filter(Boolean).join(" @ ")}
              {formatRange(item.startDate, item.endDate, item.current)
                ? `  [${formatRange(item.startDate, item.endDate, item.current)}]`
                : ""}
            </p>
            {item.description && (
              <p className="cv-entry-text mt-1 whitespace-pre-line text-sm leading-6 text-zinc-700">
                {item.description}
              </p>
            )}
          </TimelineEntry>
        ))}
      </ul>
    );
  }
  if (sectionType === "education") {
    const list = items as EducationItem[];
    return (
      <ul className="cv-entries space-y-3">
        {list.map((item, i) => (
          <TimelineEntry key={item.id} accent={accent} isLast={i === list.length - 1}>
            <p className="cv-entry-title text-sm font-bold text-zinc-900">
              {[item.degree, item.field].filter(Boolean).join(" · ") || "Titulación"}
            </p>
            <p className="cv-entry-meta text-xs" style={{ fontFamily: MONO }}>
              {[item.school, formatRange(item.startDate, item.endDate)]
                .filter(Boolean)
                .join(" @ ")}
            </p>
            {item.description && (
              <p className="cv-entry-text mt-1 whitespace-pre-line text-sm text-zinc-700">{item.description}</p>
            )}
          </TimelineEntry>
        ))}
      </ul>
    );
  }
  if (sectionType === "skills" || sectionType === "digitalSkills") {
    return (
      <ul className="cv-entries space-y-2">
        {(items as SkillItem[]).map((item) => (
          <li key={item.id} className="cv-entry">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "2mm" }}>
              <span className="cv-entry-title text-sm font-semibold text-zinc-900">
                {item.name || "—"}
              </span>
              {typeof item.level === "number" && (
                <span className="cv-entry-meta text-xs" style={{ fontFamily: MONO }}>
                  {item.level}/5
                </span>
              )}
            </div>
            {typeof item.level === "number" && (
              <div
                role="presentation"
                style={{ height: "1.5mm", backgroundColor: "#e4e4e7", marginTop: "1mm" }}
              >
                <div style={{ height: "100%", width: `${(item.level / 5) * 100}%`, backgroundColor: accent }} />
              </div>
            )}
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
            {item.level && (
              <span style={{ fontFamily: MONO }}> [{item.level}]</span>
            )}
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
            <p className="cv-entry-meta text-xs text-zinc-500" style={{ fontFamily: MONO }}>
              {[item.url, (item.technologies ?? []).join(", ")].filter(Boolean).join(" // ")}
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
