# CV Studio — Roadmap para el grupo de agentes

**Fecha de redacción:** 2026-10-13
**Base:** análisis del repo `buildercv-convex` (Next 16.4, React 19, Convex, Clerk, 9 plantillas, 66 tests unitarios, 50 e2e declarados).
**Orden de lectura obligatorio antes de tocar nada:** este archivo → `docs/architecture.md` → `docs/data-model.md` → `docs/roadmap-futuro.md` → `docs/pdf-testing.md`.

> Nota de método: este roadmap sale de leer el código, no de ejecutarlo. La **Fase 0** existe para confirmar la línea base real antes de construir encima. Si algo de este documento contradice lo que veas en el repo, manda el repo: corrige este archivo en tu informe.

---

## 1. Reglas globales (valen para TODOS los agentes)

### 1.1 Invariantes intocables
1. **Preview = print.** Un único renderizador (`TemplateRenderer`, modo `preview` | `print`) sirve a la vista previa y al PDF. No crear un segundo motor de impresión.
2. **El documento siempre es papel claro**, independientemente del tema de la app.
3. **El servidor es la autoridad.** Toda regla de validación debe existir en `convex/` (el cliente puede saltarse la UI). La identidad sale siempre de `ctx.auth`, jamás de un argumento.
4. **Estilos estructurales de plantilla en línea o con ganchos `cv-*`** para que viajen al PDF.
5. **Sin dependencias nuevas sin justificarlas** en el informe (peso, mantenimiento, alternativa nativa descartada).

### 1.2 Espejo cuádruple del modelo
Cualquier cambio en el modelo de datos o su validación exige actualizar **los cuatro** y sus tests:
`types/resume.ts` + `lib/validation/resume.ts` + `convex/resumeModel.ts` + `lib/resume.ts` (y `convex/contentLimits.ts` si afecta a límites). Actualizar también `docs/data-model.md`.

### 1.3 Push de Convex
Tras tocar `convex/` **o cualquier fichero que importe** (`features/templates/types.ts`, `lib/*`…): `npm run convex:push` antes de dar la funcionalidad por buena. Sin push el despliegue corre código antiguo y el guardado falla con errores engañosos.

### 1.4 Verificación base (antes de abrir PR y al cerrar cada tarea)
```bash
npx next typegen && npx tsc --noEmit   # typegen es obligatorio, sin él tsc da un falso error
npm run lint
npm test
npm run build
npm run test:e2e
```
No se cierra una tarea con ninguno de estos en rojo. Si ya estaba en rojo antes de empezar, se documenta en el informe y no se "arregla de paso" fuera del alcance.

### 1.5 Protocolo de trabajo en paralelo
- **Propiedad de ficheros:** cada tarea declara los ficheros que posee. No edites ficheros de otra tarea; si lo necesitas, pide el cambio en tu informe o espera al relevo.
- **Puntos calientes** (alta probabilidad de conflicto): `package.json`/`package-lock.json`, `convex/schema.ts`, `convex/resumes.ts`, `lib/validation/resume.ts`, `convex/resumeModel.ts`, `types/resume.ts`. Regla: en cada oleada, **un solo agente** es dueño de cada punto caliente (está indicado en cada tarea). Los demás piden sus cambios a ese dueño o rebasan después.
- **Una rama por tarea:** `agente/<ID>-<slug>`. Commits pequeños, mensaje `ID: descripción` (ej. `S1: valida tipo y tamaño de foto en servidor`).
- **Informe de cierre:** un archivo propio `docs/informes/<ID>.md` (evita conflictos en un documento compartido) con: qué se hizo, qué no, decisiones, resultado de la verificación base, riesgos pendientes y cualquier discrepancia con este roadmap.
- **Textos visibles en castellano**, identificadores de código en inglés (convención actual del repo).
- **No tocar `AGENTS.md` salvo el bloque que regenera `next dev`.** Léelo: advierte de que esta versión de Next tiene cambios incompatibles; consulta `node_modules/next/dist/docs/` antes de usar APIs de Next.

### 1.6 Plantilla de tarea (cómo está escrita cada una)
**Objetivo · Por qué · Ficheros que posee · Pasos · Criterios de aceptación · Tests exigidos · Dependencias · Riesgos / preguntas abiertas.**

---

## 2. Decisiones que necesitan a un humano (bloqueos conocidos)

Los agentes **no deben inventar estos valores**: proponen un valor por defecto, lo implementan configurable y lo marcan en su informe.

| # | Decisión | Valor propuesto por defecto | Afecta a |
|---|---|---|---|
| H-1 | Máximo de CVs por usuario | 30 | S2 |
| H-2 | Tipos y tamaño máximo de foto | `image/jpeg`, `image/png`, `image/webp`; 5 MB | S1 |
| H-3 | Límite de exportaciones PDF por usuario | 6 por minuto | S3 |
| H-4 | Credenciales/entorno de pruebas de Clerk (usuario de test, claves de instancia de desarrollo) | — (sin esto T2 no puede terminar) | T2 |
| H-5 | Host de producción y dominio | ver Fase Final | Fase Final |
| H-6 | Política de retención de fotos huérfanas | borrar a las 24 h | S1 |

---

## 3. Mapa de oleadas y dependencias

```
Oleada 0 ──► Línea base (B0)
                │
Oleada 1 ──► F1 Enlaces   S1 Fotos   S2 Límites   S3 PDF robusto   H1 Higiene   T2 E2E autenticada   (en paralelo)
                │                                        │                              │
Oleada 2 ──► T1 Paridad PDF automatizada (necesita F1 + S3)          │
                │                                                                       │
Oleada 3 ──► R1 Refactor del editor (necesita T2 verde) ◄─────────────────────────────┘
                │
Oleada 4 ──► Producto (P1…P8) — cada uno condicionado a señal de usuarios
                │
Oleada FINAL ► Despliegue (D1…D8)
```

---

## 4. Oleada 0 — Línea base

### B0 · Verificar el estado real
- **Objetivo:** confirmar que el repo está tal y como dice la documentación antes de que nadie construya encima.
- **Ficheros que posee:** ninguno de código. Solo `docs/informes/B0.md`.
- **Pasos:**
  1. `npm ci` y ejecutar la verificación base completa (§1.4).
  2. Registrar números reales: tests unitarios (se declaran 66), e2e (se declaran 50), tiempo de build.
  3. Confirmar que `convex/_generated` está en sync (`npm run convex:push` en un despliegue de desarrollo).
  4. Listar discrepancias con el README y los docs (por ejemplo: `README` cita `CV_STUDIO_AGENT_BRIEF.md`, que no está en el repo).
- **Criterios de aceptación:** informe con tabla "declarado vs real" y confirmación explícita de que las oleadas siguientes pueden arrancar, o lista de bloqueos.
- **Dependencias:** ninguna. **Bloquea:** todo lo demás.

---

## 5. Oleada 1 — Funcionalidad y endurecimiento (en paralelo)

### F1 · Enlaces clicables y seguros en CV y PDF
- **Objetivo:** que los enlaces de un CV (LinkedIn, portfolio, GitHub, proyectos) sean `<a href>` reales, clicables también en el PDF.
- **Por qué:** hoy las plantillas pintan `l.label || l.url` como texto plano (p. ej. `ClassicTemplate.tsx:113`). Con etiqueta «LinkedIn» el PDF muestra solo «LinkedIn», sin URL ni enlace: el lector no puede llegar al destino.
- **Ficheros que posee:** `features/templates/*` (incluido `shared.tsx`), `lib/validation/resume.ts` (solo reglas de URL), `convex/contentLimits.ts` (solo reglas de URL), `features/exports/printCss.ts` (solo estilos de enlace), tests correspondientes.
- **Pasos:**
  1. Crear un componente/helper único en `features/templates/shared.tsx` (`CvLink`) y usarlo en **las 9 plantillas**; ninguna plantilla debe pintar enlaces por su cuenta.
  2. **Seguridad:** permitir solo esquemas `https:`, `http:` y `mailto:`. Bloquear `javascript:`, `data:` y cualquier otro. Normalizar URLs sin esquema (`linkedin.com/in/x` → `https://linkedin.com/in/x`).
  3. Aplicar la misma regla **en cliente (Zod) y en servidor (`assertContentLimits`)**. El servidor debe rechazar un esquema peligroso aunque el cliente lo permita.
  4. En `preview`: `target="_blank"` + `rel="noopener noreferrer"`. En `print`: enlace normal (Chromium lo conserva como anotación PDF).
  5. Decidir y documentar qué se muestra cuando hay etiqueta y URL (propuesta: etiqueta visible como texto del enlace; no perder la URL, que va en el `href`).
  6. Estilo de enlace coherente con cada plantilla, sin romper el invariante de papel claro ni el contraste ATS de `classic`/`minimal`.
- **Criterios de aceptación:**
  - Test por plantilla: el HTML renderizado contiene `<a href="https://…">` para un enlace válido.
  - Test de rechazo en servidor: `javascript:alert(1)` es rechazado por `update`.
  - El PDF generado contiene anotaciones de enlace (verificable con `pdfinfo`/biblioteca PDF en test, o en T1).
  - Verificación base en verde.
- **Dependencias:** ninguna. **Cuidado:** toca las 9 plantillas; avisar a R1/P* si siguen abiertos.
- **Riesgos:** datos antiguos con URLs sin esquema → la normalización debe ser tolerante al renderizar, no solo al guardar (no romper CVs existentes ni exigir migración).

### S1 · Subida de fotos: validación en servidor y limpieza de huérfanas
- **Objetivo:** que ningún usuario pueda llenar el storage con archivos arbitrarios y que las subidas abandonadas no se acumulen.
- **Por qué:** `generateUploadUrl` solo exige sesión; el límite de 5 MB y el redimensionado viven únicamente en `PhotoUploader.tsx`. Cualquier usuario autenticado puede subir cualquier archivo directamente. Además, una foto subida y nunca asociada queda huérfana para siempre.
- **Ficheros que posee:** `convex/files.ts`, `convex/schema.ts` (**dueño exclusivo del punto caliente en esta oleada**), nuevo `convex/crons.ts`, `features/editor/PhotoUploader.tsx`, `convex/files.test.ts`.
- **Pasos:**
  1. Convex no permite restringir tipo/tamaño en `generateUploadUrl`. La validación se hace **después de subir**: al asociar el `storageId` al CV, leer metadatos con `ctx.db.system.get(storageId)` (tamaño y `contentType`) y rechazar + borrar el archivo si no cumple H-2.
  2. Decidir y documentar el punto de asociación: o bien una mutación explícita `attachPhoto` (recomendado: un único camino de validación), o bien validar dentro de `update` cuando cambia `photoStorageId`. Justificar la elección.
  3. Registro de subidas pendientes: tabla `uploads { userId, storageId, createdAt }` (recomendado) para que la limpieza no tenga que escanear todos los CVs. Marcarla como asociada al adjuntar.
  4. Cron diario que borre subidas no asociadas con más de H-6 (24 h por defecto).
  5. Límite de subidas pendientes por usuario (propuesta: 5) para evitar abuso entre limpiezas.
  6. Mantener intacto el comportamiento actual de borrado en cascada y de duplicado compartiendo fichero (`deletePhotoIfUnreferenced`).
- **Criterios de aceptación:**
  - Test: subir un archivo de tipo no permitido (por ejemplo `text/html`) y de tamaño excesivo → rechazado y borrado del storage.
  - Test: una subida sin asociar a las 24 h es eliminada por la limpieza (la función de limpieza debe ser invocable en test sin esperar al cron).
  - Test: duplicar/borrar CV sigue sin dejar huérfanos ni borrar fotos compartidas.
  - Push de Convex hecho y flujo de subida verificado con sesión real (manual, anotar en informe).
- **Dependencias:** H-2, H-6.
- **Riesgos:** cambios de esquema → `convex:push`; la tabla nueva es aditiva (no requiere migración).

### S2 · Tope de CVs por usuario y listado acotado
- **Objetivo:** acotar el coste de `list` y de `deletePhotoIfUnreferenced`, que hoy hacen `.collect()` de todos los CVs completos del usuario.
- **Ficheros que posee:** `convex/resumes.ts` (**dueño exclusivo del punto caliente en esta oleada**), `features/resumes/ResumesPanel.tsx`, `convex/resumes.test.ts`.
- **Pasos:**
  1. `create` y `duplicate` rechazan al superar H-1 con un `ConvexError` en castellano, y la UI muestra el aviso (no un error genérico) y deshabilita «Nuevo CV» con explicación.
  2. **Atención, trampa conocida:** el panel pinta miniaturas reales usando el `content` completo que devuelve `list`. **No convertir `list` en metadatos sin más**: rompería las miniaturas. El tope de CVs ya acota el coste; si se quiere ir más lejos, paginar (`paginate`) en lugar de quitar `content`.
  3. Revisar `deletePhotoIfUnreferenced` (recorre todos los CVs del usuario): con el tope es aceptable, pero documentar el coste máximo resultante.
  4. Los CVs archivados cuentan o no para el tope: decidir, documentar y probar.
- **Criterios de aceptación:**
  - Test: el CV número H-1+1 es rechazado en `create` y en `duplicate`.
  - Test: un usuario no puede esquivar el tope usando `duplicate`.
  - El panel sigue mostrando miniaturas (e2e/manual) y el aviso de tope es comprensible.
- **Dependencias:** H-1. **Coordinación:** S1 posee `schema.ts`; si S2 necesita un índice nuevo, lo pide a S1.

### S3 · Exportación PDF robusta
- **Objetivo:** que la ruta de PDF (`app/api/resumes/[id]/pdf/route.ts`), la más cara de la app, resista concurrencia, abuso y caídas de Chromium.
- **Ficheros que posee:** `app/api/resumes/[id]/pdf/route.ts`, nuevo `lib/pdf/*` (cola, límite de tasa, gestor de navegador), tests asociados.
- **Pasos:**
  1. **Recuperación de Chromium:** hoy el singleton `browserPromise` solo se reinicia si `launch()` falla. Si el navegador muere después, queda roto para siempre. Escuchar `browser.on("disconnected")` y reiniciar el singleton.
  2. **Concurrencia acotada:** semáforo con N páginas simultáneas (propuesta: 2) y cola máxima (propuesta: 10); si la cola está llena, `503` con `Retry-After`.
  3. **Timeout** por exportación (propuesta: 30 s) que cierre la página y devuelva error claro.
  4. **Límite de tasa por `userId`** (H-3). Empezar en memoria; dejar la interfaz preparada para sustituirlo por un contador en Convex si se despliega con más de una instancia (ver Fase Final).
  5. Cabeceras: `Cache-Control: no-store` en la respuesta del PDF.
  6. Códigos HTTP coherentes: 401 sin sesión, 404 no encontrado, 429 límite, 503 saturado, 500 resto; mensajes en castellano; la UI (`EditorToolbar`) debe mostrar un mensaje útil en 429/503 en lugar de descargar un JSON.
  7. Registro mínimo estructurado (duración, tamaño, error) sin datos personales del CV.
  8. Migrar de `playwright` a `playwright-core` solo si el despliegue elegido lo exige; **no moverlo a `devDependencies`**: la ruta lo importa en tiempo de ejecución.
- **Criterios de aceptación:**
  - Test unitario del semáforo/cola/límite de tasa (sin lanzar Chromium real).
  - Prueba manual documentada: matar el proceso de Chromium y comprobar que la siguiente exportación se recupera.
  - Prueba de carga simple (p. ej. 20 peticiones concurrentes): nunca más de N páginas abiertas, el resto en cola o con 503.
- **Dependencias:** H-3. **Alimenta:** T1 y la Fase Final (la decisión de host condiciona la estrategia de límite de tasa).

### H1 · Higiene técnica y documental
- **Objetivo:** cerrar la deuda menor que confunde a futuros agentes.
- **Ficheros que posee:** `package.json`/`package-lock.json` (**dueño exclusivo del punto caliente en esta oleada**), `middleware.ts` (o `proxy.ts`), `README.md`, `docs/data-model.md`, `docs/roadmap-futuro.md` (solo para marcar lo superado por este documento). **No** toca `docs/deployment.md` (lo posee la Fase Final).
- **Pasos:**
  1. Migrar `middleware.ts` → `proxy.ts` según la guía de Next 16.4 (leer `node_modules/next/dist/docs/`) y la de Clerk. Sustituir `createRouteMatcher` deprecado si la guía de `@clerk/nextjs` v7 lo indica. **Las e2e de guards (`e2e/guards.spec.ts`) son el árbitro**: deben seguir en verde.
  2. `README`: quitar la referencia a `CV_STUDIO_AGENT_BRIEF.md` si el archivo no existe (o indicar dónde está), y actualizar el estado a lo real.
  3. `docs/data-model.md`: corregir "los cuatro campos nuevos son v.optional" (ya hay más) y documentar todo el modelo actual, incluido `layout` y `photoStorageId`.
  4. Marcar en `docs/roadmap-futuro.md` que este documento lo sustituye como fuente de verdad del plan.
  5. Revisar dependencias: sin cambios de versión mayores; solo lo necesario (incluido el soporte a S3/T2 si piden paquetes).
- **Criterios de aceptación:** verificación base en verde; e2e de guards intactas; `docs/` coherente con el código.
- **Dependencias:** ninguna. Es el dueño de `package.json`: S1/S3/T2 le piden ahí sus dependencias o las añaden en su rama y rebasan.

### T2 · E2E autenticada con Clerk
- **Objetivo:** cubrir con tests los flujos con sesión (crear, editar, autoguardar, duplicar, archivar, borrar, exportar PDF), hoy solo manuales. Es la **red de seguridad que habilita R1 (refactor)**.
- **Ficheros que posee:** `e2e/*`, `playwright.config.ts`, helpers de test nuevos.
- **Pasos:**
  1. Investigar la forma soportada por Clerk para tests de Playwright (tokens de testing / `@clerk/testing`), leyendo la documentación vigente; proponer la opción elegida en el informe.
  2. Configurar un proyecto/setup de Playwright que obtenga sesión una vez y la reutilice (`storageState`).
  3. Usar un despliegue Convex y una instancia Clerk **de desarrollo/pruebas**; nunca producción. Datos de test aislados y limpiados al terminar.
  4. Specs mínimos: crear CV → editar un campo → recargar y comprobar persistencia; cambiar plantilla y diseño; reordenar sección (teclado); subir foto; duplicar; archivar/desarchivar; borrar con Deshacer; exportar PDF (respuesta 200, `application/pdf`, cabecera `%PDF`).
  5. Documentar cómo ejecutarlos localmente y qué variables necesita (sin valores reales en el repo).
- **Criterios de aceptación:** los specs pasan en limpio y de forma repetible (ejecutar 3 veces seguidas sin fallos intermitentes); instrucciones en `docs/`.
- **Dependencias:** **H-4 (bloqueo humano)**. Si no hay credenciales, el agente entrega todo lo posible, deja los specs marcados y lo reporta como bloqueo.
- **Riesgos:** flakiness por el autoguardado con debounce (800 ms): esperar a la señal de "Guardado" visible, nunca a timeouts fijos.

---

## 6. Oleada 2 — Paridad de PDF automatizada

### T1 · Matriz de paridad preview/PDF
- **Objetivo:** convertir la QA manual de PDFs (hoy el mayor riesgo sin cobertura) en una batería automatizada.
- **Por qué:** el invariante *preview = print* es lo más valioso del proyecto y lo único que ningún test actual protege de extremo a extremo.
- **Ficheros que posee:** `features/exports/fixtures.ts`, nuevos tests de exportación, scripts de verificación.
- **Pasos:**
  1. Matriz: **9 plantillas × {CV corto, CV largo} × {1 columna, 2 columnas} × {con foto, sin foto}**, usando `buildPrintHtml` + Chromium (no requiere sesión ni Convex).
  2. Por cada celda comprobar: (a) PDF generado; (b) **texto íntegro** extraído del PDF contiene todo el contenido visible esperado y no contiene secciones ocultas; (c) número de páginas razonable (sin página vacía final ni corte de bloque que debe ir junto); (d) enlaces presentes como anotaciones (tras F1).
  3. Capturas de referencia por plantilla (visual regression con `toHaveScreenshot` del propio Playwright, mismo Chromium) y un procedimiento para actualizarlas conscientemente.
  4. Ejecutable en CI y localmente con un único comando documentado en `docs/pdf-testing.md`.
  5. Comprobaciones específicas de las plantillas nuevas: hilos de la línea de tiempo y barras (técnica), banda oscura con texto blanco (ejecutiva), bloque de acento y anillo de foto (enérgica).
- **Criterios de aceptación:** la batería pasa; un cambio deliberado de maquetación hace fallar el test correspondiente (demostrarlo en el informe); `docs/pdf-testing.md` actualizado.
- **Dependencias:** F1 y S3 cerrados (si no, habría que regenerar capturas).
- **Nota:** esto **no sustituye** la revisión visual humana de calidad estética; la reduce a juzgar solo diferencias.

---

## 7. Oleada 3 — Refactor del editor

### R1 · Dividir `EditorShell` y `SectionForm`
- **Objetivo:** reducir el coste de cambio en los dos mayores ficheros de UI (`SectionForm.tsx` ≈ 733 líneas, `EditorShell.tsx` ≈ 654) sin alterar comportamiento.
- **Ficheros que posee:** `features/editor/*` (excepto `useAutosave.ts`, que no se toca salvo bug demostrado).
- **Condición de entrada:** **T2 verde y estable.** Sin e2e autenticada, no se refactoriza.
- **Pasos:**
  1. Mapear responsabilidades actuales (estado local, commit de layout, autoguardado, deshacer, banner de validación, pestañas móviles, formularios por tipo de sección).
  2. Extraer sin cambiar lógica: un componente de formulario por tipo de sección; hooks (`useResumeDraft`, `useUndo`…) para el estado; mantener `commitLayout` atómico y `lib/compare.ts` canónico (corrigen un bucle de guardado real: **no reintroducir comparaciones sensibles al orden de claves**).
  3. Refactor en PRs pequeños, cada uno con e2e + unitarios en verde.
- **Criterios de aceptación:** ningún fichero de editor por encima de ~350 líneas; comportamiento idéntico (e2e + tests existentes sin modificar); sin regresión del autoguardado ni del arrastre (ratón, táctil, teclado).
- **Riesgos:** la lógica de guardado es sutil (última escritura gana, contador monótono). Cualquier duda → no tocar y documentar.

---

## 8. Oleada 4 — Producto (condicionado a señal de usuarios)

No empezar ninguna de estas tareas sin que un humano confirme prioridad y haya desplegado y recogido feedback (Fase Final). Orden sugerido por valor/riesgo:

| ID | Tarea | Notas para el agente |
|---|---|---|
| P1 | **Importar CV existente** (PDF/LinkedIn) | Parsear a la estructura actual de secciones; siempre pasa por validación de servidor; mostrar revisión antes de guardar. |
| P2 | **Asistente de redacción con IA** | El contenido ya es estructurado, buen encaje. Requiere decisión de proveedor, coste y privacidad (los datos del CV son personales). Definir qué se envía y qué no. |
| P3 | **Compartir CV por enlace público** | Cambia el modelo de acceso: hoy todo es privado por `userId`. Exige revisión de seguridad específica, enlaces revocables y sin indexar. |
| P4 | **Numeración de páginas y metadatos del PDF** | Limitación conocida del MVP. Cuidado con paridad preview/print (T1 debe cubrirlo). |
| P5 | **Temas de color (2–3) y persistir el tema por usuario** | Chrome ya migrado a 16 tokens semánticos; el documento no cambia. |
| P6 | **Recorte manual de foto** | Mejora de `PhotoUploader`; respeta las validaciones de S1. |
| P7 | **Undo/redo local** | Choca con autoguardado/debounce; diseño documentado antes de implementar. |
| P8 | **Más distribuciones y variantes de cabecera** (vía A de F4) | Riesgo cero sobre el invariante. El canvas libre (vía C) sigue **descartado** hasta un spike que demuestre paridad preview≈PDF. |

---

## 9. OLEADA FINAL — Despliegue

> Va al final por decisión del equipo. Aun así, las tareas S3 (PDF) y T1 (paridad) condicionan lo que sigue, y **el despliegue es lo que da usuarios reales y datos para decidir la Oleada 4**.

### 9.1 El problema
La ruta de PDF lanza un Chromium completo de Playwright (~200 MB). Eso decide dónde puede vivir la app. El resto (Convex, Clerk) es SaaS y no condiciona.

### 9.2 Opciones

| Opción | Descripción | Pros | Contras |
|---|---|---|---|
| **A. Host Node con contenedor (recomendada)** | Docker con `next start` + Chromium instalado, en Fly.io / Railway / Render o un VPS | Sin cambios de código; Chromium completo (máxima paridad con el preview); coste predecible | Hay que gestionar la imagen, memoria (Chromium consume bastante) y escalado; el límite de tasa en memoria solo vale con una instancia |
| **B. Vercel + Chromium ligero** | `playwright-core` + `@sparticuz/chromium` en función serverless | Un solo proveedor; escalado automático | Límites de tamaño de bundle y de duración de función; arranques en frío con Chromium; riesgo de diferencias de renderizado frente a Chromium completo; **verificar límites vigentes** del plan antes de decidir |
| **C. Servicio de PDF aparte** | App en Vercel/cualquier sitio; PDF en un servicio separado (contenedor propio o servicio gestionado de renderizado) | Aísla el componente caro y frágil; escala por separado | Dos despliegues y un contrato entre ambos; hay que autenticar la llamada y no filtrar datos |
| **D. API de terceros para PDF** | Enviar el HTML a un proveedor externo | Cero mantenimiento de Chromium | Los datos personales del CV salen a un tercero (privacidad/RGPD); coste por uso; dependencia externa |

**Recomendación:** empezar por **A**. Es la única opción que no exige tocar el renderizador ni asume nada sobre límites de plataforma, y el invariante *preview = print* se mantiene con el mismo Chromium que usan T1 y los tests. Si el uso crece, evolucionar a **C** extrayendo la ruta PDF a su propio contenedor (el código de S3 ya queda aislado en `lib/pdf/*`, lo que facilita esa extracción). **D** solo con una evaluación de privacidad explícita.

> Antes de decidir, un agente debe **verificar con la documentación vigente** los límites y precios actuales de la plataforma elegida; no confiar en cifras de este documento.

### 9.3 Tareas de despliegue

| ID | Tarea | Detalle |
|---|---|---|
| D1 | **Decisión de host (H-5)** | Un humano elige entre A–D con el análisis de arriba. Hasta entonces no se escribe infraestructura. |
| D2 | **Contenedor** (si A o C) | `Dockerfile` reproducible: Node 24, `npm ci`, `next build`, Chromium con sus dependencias del sistema (`playwright install --with-deps chromium` o imagen oficial de Playwright), usuario no root, healthcheck. Tamaño y tiempo de arranque documentados. |
| D3 | **Entornos y secretos** | Instancia **de producción** de Clerk (claves `pk_live`/`sk_live`) con su JWT template `convex`; `CLERK_JWT_ISSUER_DOMAIN` en el despliegue `prod` de Convex; variables del host según `docs/deployment.md`. Nada de secretos en el repo. |
| D4 | **Backend a producción** | `npx convex deploy` con las funciones de S1/S2 y el cron de limpieza activo. Verificar que el cron está registrado en prod. |
| D5 | **CI** | Pipeline que ejecute la verificación base + T1 en cada PR; despliegue automático solo desde `main` y solo si todo está en verde. El orden obligatorio es: `convex deploy` antes del despliegue del frontend (regla §1.3). |
| D6 | **Escalado y límite de tasa** | Si se despliega con más de una instancia, sustituir el límite de tasa en memoria de S3 por un contador compartido (por ejemplo en Convex). Dimensionar memoria según la concurrencia de S3. |
| D7 | **Observabilidad** | Logs estructurados de la ruta PDF (duración, errores, saturación), alerta ante tasa de 5xx, y seguimiento de uso de storage de Convex. |
| D8 | **Verificación posdespliegue** | Ejecutar T2 y T1 contra el entorno desplegado (`BASE_URL`; documentar el override del `baseURL` fijo de `playwright.config.ts`), prueba manual de exportación PDF con un CV real, comprobación de que `/dashboard`, `/editor` y `/cuenta` exigen sesión. |

- **Poseedor de `docs/deployment.md`:** el agente de D2–D8. Debe reescribirlo: hoy dice "sin modo oscuro", que ya no es cierto.
- **Criterios de aceptación de la fase:** app accesible en el dominio elegido, PDF funcional bajo la concurrencia definida en S3, CI desplegando desde `main`, `docs/deployment.md` verificado paso a paso por alguien que no lo escribió.

---

## 10. Resumen ejecutable

| Oleada | Tareas | Paralelo | Bloqueo humano |
|---|---|---|---|
| 0 | B0 | — | — |
| 1 | F1, S1, S2, S3, H1, T2 | Sí (6 agentes, ficheros disjuntos) | H-1, H-2, H-3, H-4, H-6 |
| 2 | T1 | No (necesita F1 + S3) | — |
| 3 | R1 | No (necesita T2) | — |
| 4 | P1–P8 | Según prioridad | Confirmación de producto |
| Final | D1–D8 | Parcial tras D1 | H-5 |
