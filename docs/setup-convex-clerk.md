# Guía de instalación: Convex + Clerk (proyecto CV Studio)

Cómo se instaló el backend Convex y cómo se integró Clerk como proveedor
de autenticación. Verificado el 2026-10-10 con `convex@1.46.0` y
`@clerk/nextjs@7.9.14`. Si algo difiere en tu máquina, manda la
documentación oficial (`docs.convex.dev`, `clerk.com/docs`), no la memoria.

## 1. Convex

### 1.1 Instalar dependencias

```bash
npm install convex
```

### 1.2 Crear el despliegue dev y arrancar la sincronización

```bash
npx convex dev
```

Hace, en orden: login en Convex (solo la primera vez), crea o reutiliza el
proyecto, provisiona un *dev deployment*, escribe `.env.local` con
`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL` y
`NEXT_PUBLIC_CONVEX_SITE_URL`, genera `convex/_generated/` (no editar, no
auditar en lint) y sube las funciones de `convex/`. Después queda vigilando
cambios: cada vez que guardas un archivo de `convex/`, lo vuelve a subir.

Para crear un proyecto **nuevo** sin preguntas interactivas:

```bash
npx convex dev --configure new --team <team_slug> --project <project_slug> --dev-deployment cloud --once
```

`--once` sube el código y termina (sin quedarse vigilando). Útil en scripts
y para verificar pushes.

### 1.3 Comandos habituales

```bash
npx convex dev --once                      # subir código una vez y salir
npx convex env list                        # ver variables del despliegue
npx convex env set NOMBRE valor            # definir variable (ej. abajo)
npx convex logs --history 40               # últimos logs (sin --limit; esa flag no existe)
npx convex run <modulo:funcion> '<json>'   # ejecutar query/mutation/action
npx convex data <tabla> --limit 5          # inspeccionar documentos
```

Ejemplos reales usados en este proyecto:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://xxx.clerk.accounts.dev
npx convex run auth:signIn '{"provider":"password","params":{"email":"a@a.es","password":"Xy123456","flow":"signUp"}}'
```

### 1.4 Archivos en `convex/`

| Archivo           | Contenido |
| ----------------- | --------- |
| `schema.ts`       | `defineSchema({})` mínimo. Fase 2 añade las tablas de producto. |
| `auth.config.ts`  | Proveedores OIDC que la plataforma acepta (ver §2.4). |
| `_generated/`     | Generado por `npx convex dev`. No editar, excluido de ESLint. |

Se eliminaron `convex/auth.ts` y `convex/http.ts`: pertenecían a Convex Auth
(librería `@convex-dev/auth`), que se descartó (motivo en §3).

### 1.5 Variables de entorno

En `.env.local` (generado, gitignorado):

```
CONVEX_DEPLOYMENT=dev:<nombre>
NEXT_PUBLIC_CONVEX_URL=https://<nombre>.<region>.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://<nombre>.<region>.convex.site
```

En el despliegue Convex (`npx convex env set`, nunca en el repo):

```
CLERK_JWT_ISSUER_DOMAIN=https://xxx.clerk.accounts.dev
```

`.env.example` documenta los nombres sin valores reales.

## 2. Clerk + integración con Convex

### 2.1 Alta en Clerk (dashboard, manual)

1. Crea cuenta en <https://dashboard.clerk.com/sign-up> y una aplicación
   (Email + contraseña; Google opcional).
2. Activa la integración **Convex** (crea el JWT template llamado `convex`;
   sin él, Convex no recibe tokens válidos).
3. Copia la **Frontend API URL** (`https://xxx.clerk.accounts.dev`, es el
   issuer), la **Publishable Key** (`pk_test_…`) y la **Secret Key**.

### 2.2 Instalar SDK

```bash
npm install @clerk/nextjs @clerk/localizations
```

### 2.3 Variables en `.env.local`

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
CLERK_SECRET_KEY=sk_test_…
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
```

Las dos últimas alinean los redirects de Clerk con nuestras rutas (por
defecto serían `/sign-in` y `/sign-up`, que no existen).

### 2.4 Backend: `convex/auth.config.ts`

```ts
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

Tras crearlo o cambiarlo: `npx convex dev` (o `--once`). Si falta la variable,
el push avisa: `Environment variable CLERK_JWT_ISSUER_DOMAIN is used in auth
config file but its value was not set`.

Con esto, `ctx.auth.getUserIdentity()` en queries/mutations verifica los JWT
de Clerk (issuer externo). Así se usa en servidor (Fase 2 en adelante):

```ts
// Server Components / Actions / Route Handlers
import { auth } from "@clerk/nextjs/server";
const token = await (await auth()).getToken({ template: "convex" });
```

### 2.5 Frontend

**`app/layout.tsx`** (Server Component): `ClerkProvider` con `localization`
en español envolviendo todo.

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";

<ClerkProvider localization={esES}>
  <html lang="es">…</html>
</ClerkProvider>
```

**`app/ConvexClientProvider.tsx`** (Client Component): puente Clerk ↔ Convex.

```tsx
"use client";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
```

**`proxy.ts`** (mínimo: Clerk lo sigue necesitando en marcha; la autorización
vive en cada recurso, sin `createRouteMatcher` deprecado):

```ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();
```

Protección por recurso (2026-10-13): `await auth.protect()` en
`app/(dashboard)/layout.tsx` (cubre panel, archivados y cuenta) y en
`app/editor/[id]/page.tsx`; `/signin` y `/signup` redirigen al panel con
`redirect("/dashboard")` si ya hay sesión; la ruta del PDF comprueba `auth()`
y devuelve 401.

**Páginas**: `/signin` y `/signup` usan `<SignIn/>` / `<SignUp/>` de Clerk con
`routing="hash"` (evita necesitar rutas catch-all `[[...rest]]`) y
`fallbackRedirectUrl="/dashboard"`. El dashboard combina gates de
`convex/react` (`Authenticated` / `Unauthenticated` / `AuthLoading`, que
reflejan la sesión validada contra Convex) con `UserButton` de Clerk.

### 2.6 Comprobación de que funciona

1. `npx convex dev` y `npm run dev` (reinicia Next si cambió `.env.local`:
   las `NEXT_PUBLIC_*` se incrustan al arrancar).
2. Incógnito → `/signup` → crear cuenta → aterriza en `/dashboard` con el
   panel y el botón de usuario.
3. Incógnito → `/dashboard` sin sesión → redirección al login de Clerk.
4. Ver el panel `Authenticated` (y no el aviso de “iniciar sesión”)
   demuestra que Convex valida los tokens de Clerk.

## 3. Por qué no Convex Auth

Se probó primero `@convex-dev/auth` con provider Password (documentado en
`docs/implementation-plan.md`). El registro funcionaba, pero **toda**
verificación de sus JWT en plataforma fallaba con
`AuthProviderDiscoveryFailed`: el verificador no alcanzaba el discovery de
`convex.site`, ni siquiera con tokens recién creados y con los endpoints
respondiendo 200 desde fuera y desde actions. Una prueba de control con un
issuer externo sí verificó. Al ser un fallo de plataforma fuera de nuestro
código, se migró a Clerk (issuer externo), que verifica correctamente.
