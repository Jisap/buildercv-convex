import { AuthConfig } from "convex/server";

// Clerk es el proveedor de autenticación (issuer externo). Ver
// docs/architecture.md: se abandona Convex Auth porque la verificación
// de sus JWT (issuer = convex.site) falla en plataforma.
const authConfig = {
  providers: [
    {
      // Frontend API URL de Clerk, p. ej.
      // https://verb-noun-00.clerk.accounts.dev (ver .env.example).
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

export default authConfig;
