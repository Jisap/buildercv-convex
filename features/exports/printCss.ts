// CSS autónomo para el PDF (Fase 5). Se inyecta en el HTML que renderiza
// Chromium: las clases Tailwind no existen fuera de Next, así que este CSS
// cubre los ganchos `cv-*` que emiten las plantillas (mismo árbol React).
//
// Los contenedores de secciones usan display grid + gap en línea desde
// las plantillas (valor de design.sectionSpacing); por eso .cv-section
// no lleva margen propio: el espaciado lo gobierna el contenedor.
import type { ResumeDesign } from "@/types/resume";
import { withDesignDefaults } from "@/lib/resume";

export const PRINT_CSS = `
@page {
  size: A4;
  margin: 14mm 13mm 16mm 13mm;
}

* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #171717;
  font-size: 11pt;
  line-height: 1.5;
}

.cv-doc {
  max-width: 100%;
}

/* Encabezados siempre con su contenido; bloques cortos sin partir. */
.cv-doc h1, .cv-doc h2, .cv-doc h3 {
  break-after: avoid;
  page-break-after: avoid;
}
.cv-doc li.cv-entry {
  break-inside: avoid;
  page-break-inside: avoid;
}
.cv-doc p {
  orphans: 3;
  widows: 3;
}

/* Personal */
.cv-name {
  font-size: 22pt;
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 2mm 0;
}

/* Diseño del usuario: las variables viajan en línea desde docRootStyle
   (mismo árbol React que la vista previa).
   - Titulares (zoom): escala proporcional, pagina sin sorpresas.
   - Cuerpo: interlineado del diseño; los titulares conservan el suyo. */
.cv-doc .cv-name,
.cv-doc .cv-section-title,
.cv-doc .cv-entry-title {
  zoom: var(--cv-heading, 1);
}
.cv-doc :where(p, li, span):not(.cv-entry-title) {
  line-height: var(--cv-leading, 1.5);
}
.cv-contact, .cv-links {
  font-size: 9.5pt;
  color: #52525b;
  margin: 0 0 1mm 0;
}

/* Enlaces: heredan el color del contexto (nada de azul Chromium) y se
   subrayan para que se reconozcan en el PDF; el href viaja como
   anotación clicable. Compatible con lectura automática. */
.cv-doc a {
  color: inherit;
  text-decoration: underline;
}

/* Cabecera con foto (flex de Tailwind no existe en el PDF). */
.cv-personal-photo {
  display: flex;
  align-items: center;
  gap: 5mm;
}

/* Secciones (el espaciado vertical lo da el gap del contenedor). */
.cv-section {
  margin: 0;
}
.cv-section-title {
  font-size: 11pt;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-bottom: 0.4mm solid #d4d4d8;
  padding-bottom: 1mm;
  margin: 0 0 2.5mm 0;
}

/* Entradas */
.cv-entries {
  list-style: none;
  margin: 0;
  padding: 0;
}
.cv-entries > li + li {
  margin-top: 3mm;
}
.cv-entry-title {
  font-size: 11pt;
  font-weight: 700;
  margin: 0;
}
.cv-entry-meta {
  font-size: 9.5pt;
  color: #71717a;
  margin: 0.5mm 0 0 0;
}
.cv-entry-text {
  font-size: 10.5pt;
  margin: 1mm 0 0 0;
  white-space: pre-line;
}

/* Listas y pills */
.cv-inline-list {
  font-size: 10.5pt;
  margin: 0;
}
.cv-lang-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 10.5pt;
}
.cv-pills {
  list-style: none;
  margin: 0;
  padding: 0;
}
.cv-pills .cv-pill {
  display: inline-block;
  border-radius: 9999px;
  padding: 0.8mm 3mm;
  margin: 0 1.5mm 1.5mm 0;
  font-size: 9.5pt;
}

/* Banda moderna y filete */
.cv-band {
  padding: 7mm 7mm;
  margin: 0 0 5mm 0;
}
.cv-band .cv-name {
  color: #fff;
}
.cv-band .cv-contact, .cv-band .cv-links {
  color: rgba(255, 255, 255, 0.92);
}
.cv-rule {
  height: 0.8mm;
  width: 10mm;
  margin: 1mm 0 2.5mm 0;
}

/* Compacto: dos columnas en listas cortas */
.cv-cols {
  columns: 2;
  column-gap: 8mm;
}
.cv-cols > * {
  break-inside: avoid;
}

/* Distribución de dos columnas del documento (estilos en línea en las
   plantillas como fuente principal; estas reglas son red de seguridad
   para la fragmentación en varias páginas). */
.cv-layout-two-col {
  break-inside: auto;
}
.cv-layout-main,
.cv-layout-sidebar {
  break-inside: auto;
}
.cv-layout-sidebar .cv-section {
  break-inside: avoid;
}

/* Lateral: la banda lleva el color en línea; aquí el relleno, el radio
   y el texto claro (Tailwind no existe en el PDF). */
.cv-aside {
  padding: 5mm 4mm;
  border-radius: 2mm;
  color: #fff;
}
.cv-aside .cv-section-title {
  color: #fff;
  border-bottom-color: rgba(255, 255, 255, 0.45);
}
.cv-aside .cv-entry-title,
.cv-aside .cv-entry-text,
.cv-aside .cv-inline-list,
.cv-aside .cv-lang-list {
  color: #fff;
}
.cv-aside .cv-entry-meta,
.cv-aside .cv-contact,
.cv-aside .cv-links {
  color: rgba(255, 255, 255, 0.85);
}

/* Elegante: la cabecera va centrada (text-center es de Tailwind). */
.cv-elegant-head {
  text-align: center;
}

/* Mínima: el filete en acento viaja en línea; se anula el borde base. */
.cv-minimal .cv-section-title {
  border-bottom: none;
  padding-bottom: 0;
}
`;

/**
  * Sobrescribe del CSS base con los valores del diseño del usuario
  * (margen de página y tamaño de fuente). Se inyecta DESPUÉS de
  * PRINT_CSS para que mande. La separación entre secciones y el
  * relleno del documento viajan en estilos en línea desde las plantillas.
  */
export function buildDesignCss(design: ResumeDesign): string {
  const d = withDesignDefaults(design);
  const small = Math.max(8, d.fontSize - 1.5);
  const name = d.fontSize + 11;
  return `
@page {
  margin: ${d.pageMargin}mm;
}
html, body {
  font-size: ${d.fontSize}pt;
}
.cv-name {
  font-size: ${name}pt;
}
.cv-contact, .cv-links {
  font-size: ${small}pt;
}
.cv-section-title {
  font-size: ${d.fontSize}pt;
}
.cv-entry-title {
  font-size: ${d.fontSize}pt;
}
.cv-entry-meta {
  font-size: ${small}pt;
}
.cv-entry-text {
  font-size: ${d.fontSize}pt;
}
.cv-inline-list {
  font-size: ${d.fontSize}pt;
}
.cv-lang-list {
  font-size: ${d.fontSize}pt;
}
.cv-pills .cv-pill {
  font-size: ${small}pt;
}
`;
}
