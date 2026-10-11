import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isSignInPage = createRouteMatcher(["/signin(.*)", "/signup(.*)"]);
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/editor(.*)",
  "/cuenta(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
  // Con sesión iniciada, /signin y /signup redirigen al panel.
  if (isSignInPage(request) && (await auth()).isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return Response.redirect(url);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
