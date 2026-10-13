# CV Studio — Exportación PDF y pruebas (Fase 5)

## Método

- Mismo renderizador que la vista previa (`TemplateRenderer`, `mode: "print"`),
  convertido a HTML autónomo por `features/exports/printDocument.ts`.
- Las clases Tailwind no existen fuera de Next: las plantillas emiten además
  ganchos semánticos `cv-*` y `features/exports/printCss.ts` los mapea a un
  CSS de impresión propio (`@page` A4, márgenes, reglas de salto, color exacto).
- Generación en servidor con Chromium/Playwright en
  `app/api/resumes/[id]/pdf/route.ts` (runtime `nodejs`): singleton de browser,
  `page.setContent`, `page.pdf({ format: "A4", printBackground: true,
  preferCSSPageSize: true })` para que mande el `@page` propio. Responde
  `application/pdf` como adjunto; 401 sin sesión, 404 si el CV no es del usuario.
- Botón “PDF” en la cabecera del editor (descarga directa por GET).

## Fixtures

`features/exports/fixtures.ts`: `SHORT_*` (1 página) y `LONG_*` (varias
páginas: nombre largo, acentos/ñ, 5 experiencias con textos largos, 15
competencias, idiomas, sección personalizada). Tests automáticos en
`printDocument.test.ts` (contenido íntegro en el HTML, `@page`/márgenes/
saltos, escape del título).

## Verificación ejecutada (2026-10-10, Chromium local)

Script temporal (eliminado tras la prueba) con el mismo builder y Chromium:

- Corto → 1 página; largo compacto y largo moderno → 3 páginas.
- Extracción de texto del PDF (pdfjs, solo para la prueba): íntegro —
  “José María Ñíguez…”, “A Coruña”, “actualidad”, experiencias, formación,
  sección personalizada, todo presente con acentos. Sin texto cortado a
  mitad de palabra entre páginas en la muestra.

## Matriz de revisión manual (pendiente, requiere ojo humano)

| Caso | Qué comprobar |
|---|---|
| CV corto | Sin espacios extraños ni páginas vacías |
| CV de varias páginas | Sin contenido omitido ni páginas inesperadas |
| Párrafo muy largo | Fluye entre páginas sin partir palabras |
| Sección al final de página | Encabezado junto a su contenido |
| Nombre o empresa largos | Sin desbordes de columna ni margen |
| Caracteres españoles | Acentos y ñ correctos |
| Compacto (dos columnas) | Sin cortes ni desbordes |
| Sección oculta | No aparece ni deja huecos |
| Botones del editor | No aparecen en el PDF |
| Foto en moderna/lateral/elegante/compacta/enérgica/ejecutiva | Redonda, nítida, junto a la cabecera |
| Foto en clásica/mínima/técnica | No aparece (omisión por diseño; en clásica y mínima, ATS) |
| CV con foto eliminada | El PDF sale sin foto, sin error |

## Robustez de la ruta (S3, 2026-10-13)

- Singleton con recuperación (`disconnected` relanza), 2 páginas
  simultáneas + cola de 10 (503 con `Retry-After`), timeout de 30 s (500),
  límite de 6 exportaciones/min por usuario (429 con `Retry-After`).
- `Cache-Control: no-store`; registro mínimo (estado, duración, bytes, sin
  datos personales). El botón del editor pide con `fetch` y muestra el
  motivo en un aviso con Reintentar (antes descargaba el JSON del error).
- Límite en memoria: con más de una instancia del frontend, compartir el
  contador (ver `lib/pdf/rateLimit.ts`). Pruebas unitarias en
  `lib/pdf/pdf.test.ts` (sin Chromium).

## Limitaciones conocidas

- Chromium completo (~200 MB) vive fuera del repo (`ms-playwright/`); en
  local funciona. **No desplegable tal cual en Vercel serverless**
  (límite de bundle): allí haría falta `playwright-core` +
  `@sparticuz/chromium` o un servicio externo de render. Decisión de hosting
  pendiente cuando toque desplegar (Fase 6).
- Sin cabeceras/pies con numeración: no se piden en el MVP.
- Fuentes del sistema (sin descargas externas): el PDF no incrusta Inter;
  usa la pila configurada disponible en el lector.
