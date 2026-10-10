# CV Studio

Aplicación web para crear, editar, organizar y exportar currículums
profesionales. Especificación completa en `CV_STUDIO_AGENT_BRIEF.md`.

**Stack:** Next.js 16 (App Router), React 19, TypeScript estricto,
Tailwind CSS v4 (CSS-first), shadcn/ui, Convex + Clerk (email+contraseña),
Zod + React Hook Form, Lucide, Vitest, Playwright.

## Requisitos

- Node.js 24 LTS (verificado con v24.13.1) y npm 11.
- Cuenta de Convex (solo desde Fase 1 para auth y persistencia):
  `npx convex dev` te guía en el login.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y rellena NEXT_PUBLIC_CONVEX_URL + claves Clerk
npx convex dev               # genera convex/_generated + CONVEX_URL
# En el despliegue Convex define:
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://xxx.clerk.accounts.dev
npm run dev                  # http://localhost:3000
```

## Clerk (obligatorio desde Fase 1)

1. Crea cuenta en [clerk.com](https://dashboard.clerk.com/sign-up) y una
   aplicación (Email + contraseña; Google opcional).
2. Activa la integración **Convex** en el dashboard de Clerk (crea el JWT
   template `convex`) y copia la **Frontend API URL** (issuer).
3. Copia **Publishable Key** (`pk_test_…`) y **Secret Key** en `.env.local`:
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`.
4. `npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer>` (ver paso 2).

Motivo: Convex Auth se descartó porque la verificación de sus JWT en la
plataforma fallaba con `AuthProviderDiscoveryFailed` (detalle en
`docs/implementation-plan.md`). Clerk usa issuer externo y sí verifica.

## Comandos

- `npm run dev` — desarrollo.
- `npm run build` / `npm start` — build y arranque de producción.
- `npm run lint` — ESLint (cero errores en Fase 1).
- `npx tsc --noEmit` — tipos estrictos (cero errores en Fase 1).
- `npm test` — Vitest (backend Convex en memoria).
- `npx convex dev` — backend local + codegen (requiere login Convex).

## Variables de entorno

Ver `.env.example`. `NEXT_PUBLIC_*` son públicas (URLs y clave publicable,
no secretos). `CLERK_SECRET_KEY` solo en servidor, nunca en el repo.

## Estado

Fase 1: esqueleto + autenticación real (Clerk) y rutas privadas.
Detalle y criterios en `docs/implementation-plan.md`; decisiones en
`docs/architecture.md`; instalación paso a paso de Convex y Clerk en
`docs/setup-convex-clerk.md`.
