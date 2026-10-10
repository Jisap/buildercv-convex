"use client";

import { UserButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ResumesPanel } from "@/features/resumes/ResumesPanel";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <AuthLoading>
        <p className="text-sm text-zinc-600" role="status">
          Cargando tu panel…
        </p>
      </AuthLoading>
      <Unauthenticated>
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-600">Necesitas iniciar sesión.</p>
          <Button asChild className="mt-4">
            <Link href="/signin">Ir a iniciar sesión</Link>
          </Button>
        </div>
      </Unauthenticated>
      <Authenticated>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Mis currículums</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Gestiona tus CV desde un solo lugar.
            </p>
          </div>
          <UserButton />
        </div>
        <div className="mt-8">
          <ResumesPanel />
        </div>
      </Authenticated>
    </div>
  );
}
