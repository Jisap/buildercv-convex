import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk sigue necesitando el middleware/proxy en marcha; la autorización vive
// en cada recurso (`auth.protect()` en layouts/páginas servidor y checks en la
// ruta del PDF). Sin `createRouteMatcher` (deprecado): ver guía
// https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
