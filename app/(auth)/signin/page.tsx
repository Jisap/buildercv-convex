import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Usa `auth()` (sesión): sin shell estático.
export const instant = false;

export default async function SignInPage() {
  // Con sesión iniciada, redirige al panel (antes en proxy.ts).
  if ((await auth()).isAuthenticated) {
    redirect("/dashboard");
  }
  return (
    <div className="flex flex-1 items-center justify-center bg-muted px-6 py-16">
      <SignIn
        routing="hash"
        signUpUrl="/signup"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
