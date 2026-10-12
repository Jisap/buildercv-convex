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
  TemplatePhoto,
  twoColColumns,
} from "./shared";
import { partitionForLayout } from "./layout";

// Enérgica: perfiles creativos. Cabecera asimétrica con bloque de acento
// a la izquierda, nombre grande y foto a la derecha con anillo de acento.
// Secciones con marcador cuadrado en acento y competencias en píldoras.
// Foto: sí. No es ATS (el color porta información).
// Estructura en estilos en línea (viajan al PDF); Tailwind solo pule la
// vista previa. Clases `cv-*`: ganchos semánticos para el CSS de impresión.

export function EnergeticTemplate({ content, design, layout, mode, photoUrl }: ResumeTemplateProps) {
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
          ? "cv-doc cv-energetic bg-white text-zinc-900"
          : "cv-doc cv-energetic rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm"
      }
    >
      {person ? (
        <EnergeticPersonal item={person} accent={accent} photoUrl={photoUrl} />
      ) : (
        <header className="cv-personal" style={{ display: "flex", gap: "5mm", alignItems: "stretch" }}>
          <div aria-hidden style={{ width: "2.5mm", backgroundColor: accent }} />
          <h2 className="cv-name text-4xl font-black tracking-tight text-zinc-950">
            Tu nombre
          </h2>
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
            {main.map((section) => (
              <EnergeticSection key={section.id} section={section} accent={accent} />
            ))}
          </div>
          <div
            className="cv-layout-sidebar"
            style={{ display: "grid", gap, alignContent: "start" }}
          >
            {sidebar.map((section) => (
              <EnergeticSection key={section.id} section={section} accent={accent} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="cv-sections"
          style={{ display: "grid", gap, marginTop: gap }}
        >
          {main.map((section) => (
            <EnergeticSection key={section.id} section={section} accent={accent} />
          ))}
        </div>
      )}
    </article>
  );
}

function EnergeticPersonal({
  item,
  accent,
  photoUrl,
}: {
  item: PersonalItem;
  accent: string;
  photoUrl?: string | null;
}) {
  return (
    <header
      className="cv-personal"
      style={{ display: "flex", gap: "5mm", alignItems: "stretch" }}
    >
      <div aria-hidden style={{ width: "2.5mm", backgroundColor: accent }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 className="cv-name text-4xl font-black tracking-tight text-zinc-950">
          {item.fullName || "Tu nombre"}
        </h2>
        <p className="cv-contact mt-1 text-sm font-semibold tracking-wide uppercase" style={{ color: accent }}>
          {[item.email, item.phone, item.location].filter(Boolean).join(" · ")}
        </p>
        {item.links && item.links.length > 0 && (
          <p className="cv-links mt-1 text-sm text-zinc-600">
            {item.links.map((l) => l.label || l.url || "").filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      {photoUrl && (
        <div style={{ alignSelf: "center", borderRadius: "50%", padding: "1mm", backgroundColor: accent }}>
          <TemplatePhoto url={photoUrl} sizeMm={28} />
        </div>
      )}
    </header>
  );
}

function EnergeticSection({
  section,
  accent,
}: {
  section: ResumeSection;
  accent: string;
}) {
  return (
    <section aria-label={section.title} className="cv-section">
      <SectionTitle className="cv-section-title text-sm font-extrabold tracking-wide text-zinc-900 uppercase">
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "2.5mm",
            height: "2.5mm",
            backgroundColor: accent,
            marginRight: "2mm",
          }}
        />
        {section.title}
      </SectionTitle>
      <div className="mt-2">
        <EnergeticBody sectionType={section.type} items={section.items} accent={accent} />
      </div>
    </section>
  );
}

function EnergeticBody({
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
          <p
            key={item.id}
            className="cv-entry-text text-sm leading-6 font-medium text-zinc-800"
            style={{ borderLeft: `1mm solid ${accent}`, paddingLeft: "3mm" }}
          >
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
          <li
            key={item.id}
            className="cv-entry"
            style={{ borderLeft: `0.8mm solid ${accent}`, paddingLeft: "3mm" }}
          >
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
          <li
            key={item.id}
            className="cv-entry"
            style={{ borderLeft: `0.8mm solid ${accent}`, paddingLeft: "3mm" }}
          >
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
            {item.level && <span style={{ color: accent }}> · {item.level}</span>}
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
