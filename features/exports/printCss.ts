// CSS autónomo para el PDF (Fase 5). Se inyecta en el HTML que renderiza
// Chromium: las clases Tailwind no existen fuera de Next, así que este CSS
// cubre los ganchos `cv-*` que emiten las plantillas (mismo árbol React).

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
.cv-contact, .cv-links {
  font-size: 9.5pt;
  color: #52525b;
  margin: 0 0 1mm 0;
}

/* Secciones */
.cv-section {
  margin-top: 5mm;
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
`;
