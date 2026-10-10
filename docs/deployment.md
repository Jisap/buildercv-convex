# CV Studio — Guía de despliegue (Fase 6)

## Dónde desplegar

- **Frontend + PDF:** cualquier host Node.js que ejecute `next start` con
  binarios nativos (VPS, Railway, Render, Fly.io…). El PDF necesita el
  Chromium de Playwright (~200 MB, fuera del repo en `ms-playwright/`).
- **NO Vercel serverless tal cual:** el Chromium completo supera el límite
  de bundle y el runtime Edge no ejecuta binarios. Opciones: `playwright-core`
  + `@sparticuz/chromium`, API externa de render, o servicio aparte para PDF.
  Decisión pendiente cuando toque desplegar (ver `docs/pdf-testing.md`).
- **Backend:** Convex Cloud (despliegue `prod` del proyecto `cvstudio`).

## Variables

En el host del frontend (nunca en el repo):

```
NEXT_PUBLIC_CONVEX_URL=https://<prod>.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://<prod>.convex.site
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…
CLERK_SECRET_KEY=sk_live_…
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
```

En el despliegue **prod** de Convex (`npx convex env set --prod …` o dashboard):

```
CLERK_JWT_ISSUER_DOMAIN=https://<clerk-prod>.clerk.accounts.dev
```

Clerk necesita su propia instancia de producción (claves `pk_live`) y el JWT
template `convex` también en esa instancia.

## Pasos

```bash
npm ci
npm run lint && npx tsc --noEmit && npm test
npx convex deploy            # backend a prod (pide confirmación)
npm run build
npx playwright install chromium   # para el PDF en el host
npm start
```

E2E contra el despliegue: `BASE_URL=<url> npx playwright test` (el config
usa `baseURL` fijo en local; para remoto, `npx playwright test --config`
con override o variable; documentar al estrenar hosting).

## Limitaciones conocidas del MVP

- Sin modo oscuro (tema claro fijado).
- Sin colaboración en tiempo real (última escritura gana).
- Sin IA, pagos, importación externa ni mercado de plantillas (fuera de MVP
  por diseño).
- PDF sin numeración de páginas; fuentes del sistema.
- E2E cubre rutas públicas y protecciones; los flujos con sesión se prueban
  manualmente hasta montar el entorno de testing de Clerk.
- `middleware.ts` usa la convención deprecada (aviso Next 16); migrar a
  `proxy.ts` cuando la doc de Clerk/Next lo estabilice.
- `createRouteMatcher` deprecado en `@clerk/nextjs` v7 (aviso, sigue
  funcionando); migrar a checks por recurso según su guía.
