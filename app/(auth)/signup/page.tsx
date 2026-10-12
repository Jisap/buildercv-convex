import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
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
