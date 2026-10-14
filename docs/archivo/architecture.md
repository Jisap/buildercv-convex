# CV Studio — Arquitectura (Fase 0)

**Fecha:** 2026-10-10 · **Estado:** diseño técnico, sin código de producto todavía.
**Stack verificado en repo:** Next.js 16.4.0, React 19.3.0, Tailwind CSS v4.3.3
(CSS-first, `@import "tailwindcss"` en `app/globals.css`), TypeScript 5.9.3
estricto, ESLint 9 + `eslint-config-next` 16.4.0. Node v24.13.1, npm 11.7.0.
**Ausente (pendiente Fase 1-2):** Convex, shadcn/ui, Zod, React Hook Form,
Lucide, Vitest, Playwright.

## 1. Punto de partida real

`create-next-app` plano: `app/{layout,page,globals.css}`, alias `@/*`,
`next.config.ts` con `cacheComponents: true`, `partialPrefetching: true` y
`experimental.agentFeedback`. `layout.tsx` usa `LayoutProps<"/">` (rutas
tipadas de Next 16). No hay `src/`, ni `convex/`, ni `components.json`, ni
`.env.*`, ni `docs/`. `npm run lint` y `npx tsc --noEmit` pasan en verde
sobre el esqueleto (verificado 2026-10-10).

Decisión: **conservar la base** (App Router, Tailwind v4, TS estricto) y
crecer por fases del brief. No hay nada que demoler. La estructura por
`src/features/*` del brief se adoptará cuando exista la primera feature
(Fase 1: `app/(dashboard)` + `ConvexClientProvider`); no se crean carpetas
vacías antes.

## 2. Decisiones arquitectónicas

1. **Next.js 16 App Router, Server Components por defecto.** Solo `"use
   client"` en editor, formularios y previsualización interactiva. Route
   Handlers solo para lo binario (PDF) y lo que exija streaming.
2. **Convex como único backend** (sin Prisma/Postgres). Esquema con
   `defineSchema`/`defineTable` + `authTables` de `@convex-dev/auth/server`;
   índices por propietario (`by_owner` + orden por modificación). Toda
   query/mutation privada resuelve identidad vía `auth.getUserId(ctx)` —
   nunca `userId` del cliente.
3. **Autenticación: Clerk (externo) + Convex.** Contrasta con docs vigentes
   (`docs.convex.dev/auth/clerk`): `convex/auth.config.ts` con el Frontend
   API URL de Clerk, `ClerkProvider` + `ConvexProviderWithClerk` en cliente,
   `clerkMiddleware` con `/dashboard(.*)` protegida. Se descarta Convex Auth:
   la verificación de sus JWT en plataforma fallaba sistemáticamente con
   `AuthProviderDiscoveryFailed` (issuer propio `convex.site` inalcanzable
   desde el verificador Rust; probado con token fresco y con issuer externo
   de control que sí verifica). Clerk usa issuer externo y escapa del fallo.
    Tablas `auth*` eliminadas del esquema (Fase 2 define las de producto).
    Ojo con versiones: `@clerk/nextjs@7` (Core 3, 03/2026) eliminó
    `<SignedIn>`/`<SignedOut>` (lanzan error al renderizar); usar `<Show
    when="signed-in">` / `<Show when="signed-out">`.
4. **Contenido independiente de plantilla.** `ResumeContent` con secciones
   `{ id, type, title, order, visible, items[] }`, items con `id` estable
   (no índices). Uniones discriminadas TS + Zod por tipo en cliente y
   validadores Convex en servidor. Contrato único de render:
   `ResumeTemplateProps = { content, design, mode: "preview" | "print" }`.
   Tres renderizadores (clásico/ATS, moderno, compacto) comparten datos.
5. **PDF: un solo sistema de renderizado (preview = print).** Ruta
   `POST /api/resumes/[id]/pdf` (runtime `nodejs`, nunca `edge`) que
   reutiliza el renderizador en modo `print` + CSS `@media print` / `@page
   A4` y `page.pdf({ format: "A4", printBackground: true, márgenes })`.
   Solo Chromium soporta `page.pdf()`. En local: `playwright` completo con
   singleton de browser. En Vercel el Chromium full (~300 MB) supera el
   límite de función: estrategia documentada `playwright-core` +
   `@sparticuz/chromium` o API externa de render; se decide en Fase 5 tras
   probar. Fixtures corto/largo/acentos/listas + verificación de texto
   extraído, no solo HTTP 200.
6. **Guardado automático con debounce**, distinción local/persistido,
   estados guardando/guardado/error, sin optimismo falso; estrategia de
   concurrencia last-write-wins por `updatedAt` documentada como límite del
   MVP (sin colaboración realtime).
7. **Sin IA en MVP.** Límite reservado (`server/ai/` o módulo equivalente)
   sin código especulativo; ninguna clave ni llamada externa.

## 3. Flujo de datos

UI (Server/Client) → `convex/react` (`useQuery`/`useMutation` con
`ConvexAuthProvider`) → functions en `convex/` (validan + autorizan) →
tablas `users/resumes/templates/(resumeVersions)/(exports)`. PDF y Server
Actions usan `convexAuthNextjsToken()` + `fetchQuery`/`fetchMutation`.
Fotos (si se admiten) vía Convex Storage como referencias, nunca binarios
incrustados.

## 4. Riesgos (Fase 0)

- **R1 — Auth sin probar:** Convex Auth exige `npx @convex-dev/auth`,
  `SITE_URL`, `JWT_PRIVATE_KEY`/`JWKS`; si se configura mal, todo lo
  privado falla. Mitigación: Fase 1 con checklist + test de sesión.
- **R2 — PDF en hosting:** Playwright full no cabe en Vercel serverless;
  alternativa serverless-Chromium o API externa debe probarse antes de
  comprometer arquitectura (Fase 5).
- **R3 — `cacheComponents` + datos vivos:** el dashboard con queries
  autenticadas debe marcarse dinámico donde toque; si no, datos obsoletos.
  Mitigación: `preloadQuery`/`fetchQuery` con token y segmentos dinámicos.
- **R4 — shadcn + Tailwind v4:** el `init` de shadcn debe respetar config
  CSS-first (sin `tailwind.config.js`); riesgo de regresión visual. Fijar
  con revisión de diff en Fase 1.
- **R5 — Modelo de secciones:** uniones discriminadas + Zod + validadores
  Convex deben evolucionar a la par; divergencia = corrupción de datos.
  Mitigación: tipos canónicos + `docs/data-model.md` desde Fase 2.
- **R6 — Docs locales Next incompletas:** `node_modules/next/dist/docs`
  no existe en 16.4.0 (solo `generate-agent-files.js`); ante duda, fuente
  web oficial, no memoria del modelo.
