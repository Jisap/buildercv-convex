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

## Fase 3 — Contenido y editor

- Formularios RHF+Zod por tipo de sección, añadir/ocultar/eliminar/
  reordenar/duplicar, crear desde cero y desde plantilla, autosave con
  debounce y estados reales.
- Aceptación: CV completo editable sin mocks, persiste tras recarga.

## Fase 4 — Plantillas y previsualización

- Contrato `ResumeTemplateProps`, 3 renderizadores (clásico-ATS, moderno,
  compacto), personalización (acento, fuente permitida, orden/visibilidad),
  responsive + contenido largo.
- Aceptación: mismo contenido en las 3 plantillas.

## Fase 5 — PDF

- Route Handler Node + Chromium, `@page A4`, `printBackground`,
  fixtures (corto/largo/acentos/listas/custom), tests de texto en PDF de
  1 y N páginas, `docs/pdf-testing.md` con decisión de hosting.
- Aceptación: PDF íntegro, seleccionable, sin cortes inaceptables.

## Fase 6 — Endurecimiento y entrega

- E2E (Playwright) de flujos clave, a11y teclado, responsive, estados
  carga/vacío/error, revisión de logs/variables, guía de despliegue y
  limitaciones. Aceptación: checklist §14 del brief en verde.

## Pregunta bloqueante para Fase 1

- ¿Proveedor auth del MVP: **solo Password (recomendado)** o añadir
  OAuth Google/GitHub desde el inicio? Por defecto sigo con Password +
  OAuth como extensión documentada salvo que indiques lo contrario.
