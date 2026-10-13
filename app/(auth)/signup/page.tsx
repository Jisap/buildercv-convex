import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Usa `auth()` (sesión): sin shell estático.
export const instant = false;

export default async function SignUpPage() {
  // Con sesión iniciada, redirige al panel (antes en proxy.ts).
  if ((await auth()).isAuthenticated) {
    redirect("/dashboard");
  }
  return (
    <div className="flex flex-1 items-center justify-center bg-muted px-6 py-16">
      <SignUp
        routing="hash"
        signInUrl="/signin"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
