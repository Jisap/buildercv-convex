# CV Studio — Plan de implementación (Fase 0 aprobada)

Fuente: `CV_STUDIO_AGENT_BRIEF.md`. Estado global: **Fase 0 completada**,
fases 1-6 pendientes. Regla: no avanzar de fase con fallos críticos o
criterios incumplidos.

## Comandos verificados (2026-10-10, Node v24.13.1 / npm 11.7.0)

- `npm run dev` — desarrollo (Turbopack, `@tailwindcss/turbopack`).
- `npm run build` / `npm start` — build y arranque prod.
- `npm run lint` — ESLint (verde en esqueleto).
- `npx tsc --noEmit` — tipos estrictos (verde en esqueleto).
- Pendientes de añadir: `npx convex dev`, `npx vitest`, `npx playwright test`.

## Fase 0 — Inspección y diseño ✅ (2026-10-10)

- Hecho: inventario del repo, versiones reales, lint+tipos en verde,
  contraste con docs oficiales (Convex Auth, Tailwind v4 CSS-first,
  Playwright `page.pdf` solo-Chromium + límites Vercel), `docs/architecture.md`.
- Criterio: diagnóstico + riesgos + plan escritos. Cumplido con este archivo.

## Fase 1 — Esqueleto funcional (rehecha con Clerk 2026-10-10)

- Autenticación final: **Clerk** (`@clerk/nextjs` + localización `esES`).
  `convex/auth.config.ts` con `CLERK_JWT_ISSUER_DOMAIN`, `ClerkProvider` +
  `ConvexProviderWithClerk`, `clerkMiddleware` (`/dashboard(.*)` protegida,
  `/signin|/signup` redirigen con sesión), páginas `/signin` y `/signup`
  (componentes Clerk) y `/dashboard` (gates `Authenticated` de convex +
  `UserButton`). Eliminados `convex/auth.ts`, `convex/http.ts`, formulario
  propio y tablas `auth*` del esquema.
- Verificado sin claves (pendiente paso usuario): lint 0 errores, `tsc` 0
  errores, `build` OK con las 5 rutas **estáticas** (Clerk no necesita el
  layout dinámico: fuera `connection()`/`instant=false`/`Suspense`).
- ⏳ Requiere acción del usuario (5 min): crear app en Clerk, activar la
  integración Convex (crea el JWT template `convex`), copiar Frontend API
  URL + Publishable + Secret Key → `.env.local` y
  `npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer>` (el push actual lo
  `npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer>` (el push actual lo
  exige). Después: `npx convex dev` + `npm run dev` y prueba en incógnito.
- Verificado con Clerk: signup en navegador → dashboard OK (el panel
  `Authenticated` de convex confirma que la plataforma verifica los JWT de
  Clerk). Sin sesión, `/dashboard` redirige vía handshake de Clerk (el 404
  visto con curl es artefacto: sin `Accept: text/html` Clerk devuelve 404 en
  vez de redirigir; navegadores reciben 307). URLs de login en
  `NEXT_PUBLIC_CLERK_SIGN_IN_URL/SIGN_UP_URL`. **Fase 1 completa.**

- Hecho: deps (`convex`, `@convex-dev/auth`, `@auth/core@0.41.1`, `zod`,
  `react-hook-form`, `@hookform/resolvers`, `lucide-react`, base shadcn
  `button/input/label` + `components.json` + `cn()`), `convex/schema.ts`
  (authTables), `convex/auth.ts` (Password + validación Zod email y
  contraseña 8 + minúscula/mayúscula/dígito), `convex/auth.config.ts`,
  `convex/http.ts`, `ConvexClientProvider` + `ConvexAuthNextjsServerProvider`
  en `app/layout.tsx` (con `Suspense` + layout dinámico: `await connection()`
  y `instant = false`, porque el provider lee cookies y usa `Date.now()`
  interno — incompatibles con el shell estático de `cacheComponents`;
  verificado en docs Next 16.4), `middleware.ts`
  (`/dashboard(.*)` privada, `/signin` redirige si hay sesión), páginas `/`,
  `/signin`, `/dashboard` (carga/vacío/no-autenticado), `.env.example`,
  README real.
- Verificado: `npm run lint` (0 errores), `npx tsc --noEmit` (0 errores),
  `npm run build` (4 rutas dinámicas ƒ), humo dev 200 en `/`, `/signin`, `/dashboard`
  (error `Date.now()` en prerender corregido con layout dinámico).
  Incidencia `AuthProviderDiscoveryFailed` del primer `auth:signIn`: transitoria
  (discovery y JWKS responden OK; `auth:signIn` correcto posterior en logs y
  2 usuarios en tabla `users` verificados con `convex data`).
- Bloqueo 13:xx: la verificación de JWT en plataforma (`auth:isAuthenticated`
  desde middleware) falla con `AuthProviderDiscoveryFailed` incluso con token
  fresco (reproducido por CLI: signup OK → `query auth:isAuthenticated` con
  `setAuth` falla). Endpoints discovery/JWKS dan 200 desde fuera y desde una
  action V8. Causa en el cliente Rust de discovery de la plataforma Convex,
  fuera de nuestro código.   `status.convex.dev`: sin incidentes hoy (ayer hubo
  uno de red upstream). Pdte: reintentar / reportar a Convex / despliegue nuevo.
- Despliegue nuevo `cvstudio/ardent-shrimp-95` creado (claves frescas): el
  fallo es SISTEMÁTICO (token fresco también falla en `auth:isAuthenticated`).
  Issuer idéntico al byte. Bloqueo en cliente Rust de discovery de la
  plataforma. TEMP-UNBLOCK en `middleware.ts`: sin redirects por sesión
  (protección solo cliente) hasta que la verificación funcione. RESTAURAR.
- Decisiones: landing sin `Authenticated` (rompía prerender en Server
  Component); `middleware.ts` se mantiene pese al aviso de deprecación
  Next 16 (patrón documentado por Convex Auth; migrar a `proxy.ts` cuando
  la lib lo adopte). Sin `convex/_generated` (lo crea `npx convex dev`).
- ⏳ Requiere acción del usuario: `npx convex dev` ya ejecutado
  (despliegue `enduring-gazelle-881`, índices auth creados, `.env.local` con
  URLs generado; 2026-10-10). Variables `SITE_URL`, `JWT_PRIVATE_KEY` y
  `JWKS` configuradas en el despliegue dev por el agente (claves solo-dev,
  generadas fuera del repo y ya eliminadas). Humo dev con env: 200 en `/`,
  `/signin`, `/dashboard`. Pendiente: verificación manual en navegador
  (registro → dashboard → recarga → logout → ruta privada sin sesión
  redirige).
- Nota: no se instala `convex ai-files` (sin necesidad concreta; brief §1.7).
- Aceptación: pendiente de esa verificación manual; resto en verde.

## Fase 2 — Datos y permisos ✅ (código completo 2026-10-10)

- Modelo: `types/resume.ts` (9 tipos de sección, uniones discriminadas, IDs
  estables), `lib/validation/resume.ts` (Zod), `convex/resumeModel.ts`
  (validadores `v` normativos), `lib/resume.ts` (fábricas puras compartidas:
  contenido vacío válido, diseño clásico, clonado con IDs nuevos).
- Backend: tabla `resumes` + índice `by_user(userId, updatedAt)`; funciones
  `list/get/create/update/duplicate/remove` con identidad siempre desde
  `ctx.auth` y mismo error exista o no el documento.
- Tests: `convex/resumes.test.ts` 6/6 (aislamiento, ajenos, anónimo,
  validación, IDs nuevos) con `npm test` (`vitest.config.mts`).
- Panel real en `/dashboard` (`ResumesPanel`: crear/duplicar/eliminar con
  confirmación en dos clics; editar desactivado hasta Fase 3).
- Verificado: push Convex OK, lint 0, `tsc` 0, `npm test` 6/6, `build` con
  rutas estáticas, humo dev 200 en públicas (`/dashboard` sin sesión: 307
  en navegadores; curl sin `Accept: text/html` recibe 404 de Clerk).
- Entregable: `docs/data-model.md`. Pendiente: prueba manual en navegador
  con tu sesión de Clerk (crear → recargar → duplicar → eliminar).

## Fase 3 — Contenido y editor ✅ (código completo 2026-10-10)

- Ruta `/editor/[id]` (protegida en middleware, `instant = false` por ser
  dinámica) con shell de 3 paneles: navegación de secciones, formulario y
  vista previa; en móvil, pestañas. Header con título editable, indicador
  de guardado (cargando/guardando/guardado/error + reintento) y aviso al
  salir con cambios pendientes.
- Secciones: seleccionar, añadir (7 tipos), renombrar, ocultar/mostrar,
  subir/bajar, eliminar. Elementos: añadir, editar por tipo (texto, email,
  fecha `month`, número, checkbox, url, tecnologías por comas, enlaces),
  subir/bajar, eliminar. Errores de validación Zod junto al campo.
- Autoguardado (`useAutosave`, test 3/3): debounce 800 ms, nunca “guardado”
  sin confirmación, ignora respuestas antiguas, `beforeunload` si hay
  cambios. La vista previa simple deriva del mismo contenido (Fase 4 la
  sustituye por renderizadores).
- Verificado: push, lint 0, `tsc` 0, `npm test` 9/9, `build` (editor
  dinámico, resto estático), `/editor/abc` sin sesión → handshake Clerk.
- Decisión: “crear desde plantilla” se completa en Fase 4 junto a los
  renderizadores (elegir plantilla sin render sería UI falsa); Fase 3 deja
  creado “desde cero” con `templateId` guardado.
- Pendiente: prueba manual en navegador (editar, reordenar, recargar,
  estados de guardado, responsive).

## Fase 4 — Plantillas y previsualización ✅ (código completo 2026-10-10)

- Contrato `ResumeTemplateProps` (`features/templates/types.ts`) y registro
  con metadatos, allowlist (`TEMPLATE_IDS`, usada también en servidor) y
  pilas tipográficas cerradas. Lógica de contenido compartida una vez
  (`shared.tsx`); las plantillas solo aportan estilo.
- Tres renderizadores: **clásico/ATS** (una columna, acento mínimo),
  **moderno** (banda de acento, pills) y **compacto** (denso, dos columnas
  en listas). Modo `print` sin cromo, listo para Fase 5.
- Test 2/2: el mismo fixture largo se verifica íntegro en las tres
  (textos, acentos, ocultas excluidas, acento aplicado).
- Editor: `TemplatePicker` (plantilla + acento + tipografía) con autoguardado
  del diseño; vista previa = `TemplateRenderer` en ancho A4. Crear “desde
  plantilla” en el panel (selector) + allowlist en servidor.
- Verificado: push, lint 0, `tsc` 0, `npm test` 11/11, `build` (editor
  dinámico, resto estático).
- Pendiente: prueba manual (mismo contenido en las 3, contenido largo,
  responsive móvil/escritorio).
- Roadmap post-MVP (petición usuario): más plantillas y más funciones de
  edición; la arquitectura (contrato + registro) ya lo permite.

## Fase 5 — PDF ✅ (código completo 2026-10-10)

- Ruta `GET /api/resumes/[id]/pdf` (dinámica, runtime nodejs por defecto):
  auth Clerk + query con propiedad, mismo renderizador en modo `print`,
  Chromium singleton, A4 con `preferCSSPageSize`, adjunto descargable.
  401 sin sesión, 404 ajeno. Botón “PDF” en el editor.
- Clases semánticas `cv-*` en plantillas + CSS de impresión propio
  (`@page`, saltos, color exacto). Fixtures corto/largo/límite y tests 4/4.
- Verificado: lint 0, `tsc` 0, `npm test` 15/15, `build`, 401 sin sesión,
  PDFs reales generados localmente (1 y 3 páginas, texto íntegro extraído).
- Entregable: `docs/pdf-testing.md` (incluye límite de Vercel serverless).
- Pendiente: revisión visual del usuario (corto+largo en 3 plantillas).
- Incidencia resuelta: editor y PDF fallaban con “No autenticado”/401 porque
  el JWT template `convex` no existía en Clerk (lista vacía por API).
  Creado por API con `claims: {aud: "convex"}`; verificado que el flujo
  vuelve a funcionar. Si vuelve a fallar igual, mirar primero los templates.

## Fase 6 — Endurecimiento y entrega ✅ (código completo 2026-10-10)

- E2E Playwright 24/24 (`npm run test:e2e`, desktop+móvil): landing,
  redirects sin sesión (`/dashboard`, `/editor`, API 401), formularios en
  español, axe sin violaciones críticas/serias, sin desborde horizontal.
  Vitest excluye `e2e/`. Flujos con sesión: manual (Clerk exige su entorno
  de testing para E2E).
- Revisión: variables auditadas contra el código (todas en `.env.example`),
  `test-results/` gitignorado, docs al día.
- Entregable: `docs/deployment.md` (hosting Node, límites de Vercel, pasos,
  limitaciones del MVP).
- Verificado: lint 0, `tsc` 0, unit 15/15, E2E 24/24, `build`.
