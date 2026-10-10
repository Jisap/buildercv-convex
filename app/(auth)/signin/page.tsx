import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <SignIn
        routing="hash"
        signUpUrl="/signup"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
