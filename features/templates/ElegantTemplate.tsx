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
  CvLink,
  CvLinkList,
  docRootStyle,
  formatRange,
  SectionTitle,
  TemplatePhoto,
  twoColColumns,
} from "./shared";
import { partitionForLayout } from "./layout";

// Elegante: editorial sobria. Cabecera centrada con filete fino a ancho
// completo, cuerpo alineado a la izquierda, títulos en versalitas con
// filete fino y respiración generosa. El acento aparece solo en el filete
// de cabecera; el resto es monocromo.
// El centrado de cabecera viaja también en el CSS de impresión (Tailwind
// no existe en el PDF) mediante la clase `cv-elegant-head`.
// Clases `cv-*`: ganchos semánticos para el CSS de impresión.

export function ElegantTemplate({ content, design, layout, mode, photoUrl }: ResumeTemplateProps) {
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
          ? "cv-doc cv-elegant bg-white text-zinc-900"
          : "cv-doc cv-elegant rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm"
      }
    >
      {person ? (
        <ElegantPersonal item={person} accent={accent} photoUrl={photoUrl} mode={mode} />
      ) : (
        <header className="cv-personal cv-elegant-head text-center">
          <h2 className="cv-name text-4xl font-normal tracking-wide text-zinc-950">
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
              <ElegantSection key={section.id} section={section} mode={mode} />
            ))}
          </div>
          <div
            className="cv-layout-sidebar"
            style={{ display: "grid", gap, alignContent: "start" }}
          >
            {sidebar.map((section) => (
              <ElegantSection key={section.id} section={section} mode={mode} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="cv-sections"
          style={{ display: "grid", gap, marginTop: gap }}
        >
          {main.map((section) => (
            <ElegantSection key={section.id} section={section} mode={mode} />
          ))}
        </div>
      )}
    </article>
  );
}

function ElegantPersonal({
  item,
  accent,
  photoUrl,
  mode,
}: {
  item: PersonalItem;
  accent: string;
  photoUrl?: string | null;
  mode: "preview" | "print";
}) {
  return (
    <header className="cv-personal cv-elegant-head text-center">
      {photoUrl && (
        <div className="mb-3 flex justify-center">
          <TemplatePhoto url={photoUrl} sizeMm={30} />
        </div>
      )}
      <h2 className="cv-name text-4xl font-normal tracking-wide text-zinc-950">
        {item.fullName || "Tu nombre"}
      </h2>
      <p className="cv-contact mt-2 text-xs tracking-widest text-zinc-600 uppercase">
        {[item.email, item.phone, item.location].filter(Boolean).join(" · ")}
      </p>
      {item.links && item.links.length > 0 && (
        <p className="cv-links mt-1 text-xs tracking-widest text-zinc-600 uppercase">
          <CvLinkList links={item.links} mode={mode} />
        </p>
      )}
      <div
        className="cv-rule mt-3 h-px w-full"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
    </header>
  );
}

function ElegantSection({ section, mode }: { section: ResumeSection; mode: "preview" | "print" }) {
  return (
    <section aria-label={section.title} className="cv-section">
      <SectionTitle className="cv-section-title text-xs font-normal tracking-[0.25em] text-zinc-900 uppercase">
        {section.title}
      </SectionTitle>
      <div className="mt-2 border-t border-zinc-200 pt-2">
        <ElegantBody sectionType={section.type} items={section.items} mode={mode} />
      </div>
    </section>
  );
}

function ElegantBody({
  sectionType,
  items,
  mode,
}: {
  sectionType: string;
  items: ProfileItem[] | ExperienceItem[] | EducationItem[] | SkillItem[] | LanguageItem[] | ProjectItem[] | CustomItem[] | PersonalItem[];
  mode: "preview" | "print";
}) {
  if (sectionType === "profile") {
    return (
      <div className="space-y-2">
        {(items as ProfileItem[]).map((item) => (
          <p key={item.id} className="cv-entry-text font-serif text-sm leading-7 text-zinc-800 italic">
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
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="cv-entry-title text-sm font-bold text-zinc-900">
                {item.position || "Puesto"}
              </p>
              <p className="cv-entry-meta text-xs tracking-wider text-zinc-500 uppercase">
                {formatRange(item.startDate, item.endDate, item.current)}
              </p>
            </div>
            <p className="cv-entry-meta text-sm text-zinc-600">
              {[item.company, item.location].filter(Boolean).join(" · ")}
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
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="cv-entry-title text-sm font-bold text-zinc-900">
                {[item.degree, item.field].filter(Boolean).join(" · ") || "Titulación"}
              </p>
              <p className="cv-entry-meta text-xs tracking-wider text-zinc-500 uppercase">
                {formatRange(item.startDate, item.endDate)}
              </p>
            </div>
            {item.school && (
              <p className="cv-entry-meta text-sm text-zinc-600">{item.school}</p>
            )}
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
      <p className="cv-inline-list text-sm leading-7 text-zinc-800">
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
          <li key={item.id} className="flex justify-between gap-2">
            <span>{item.name || "—"}</span>
            {item.level && <span className="text-zinc-500">{item.level}</span>}
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
              {item.url ? <CvLink url={item.url} mode={mode} /> : null}
              {(item.technologies ?? []).length > 0 ? (
                <>
                  {item.url ? " · " : null}
                  {(item.technologies ?? []).join(", ")}
                </>
              ) : null}
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
