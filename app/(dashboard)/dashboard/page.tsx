"use client";

import { UserButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

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
          <div className="flex items-center gap-2">
            <Button size="sm" disabled title="Disponible en Fase 3">
              <Plus />
              Nuevo CV
            </Button>
            <UserButton />
          </div>
        </div>
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <FileText className="mx-auto size-8 text-zinc-400" aria-hidden />
          <p className="mt-3 font-medium">Aún no tienes currículums</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-600">
            La creación y edición de CV llega en la Fase 3. Tu cuenta ya
            funciona: este panel es privado y solo tú puedes verlo.
          </p>
        </div>
      </Authenticated>
    </div>
  );
}
