"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ResumesPanel } from "@/features/resumes/ResumesPanel";

export default function ArchivadosPage() {
  return (
    <div>
      <AuthLoading>
        <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
          Cargando archivados…
        </p>
      </AuthLoading>
      <Unauthenticated>
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            Necesitas iniciar sesión.
          </p>
          <Button asChild className="mt-4">
            <Link href="/signin">Ir a iniciar sesión</Link>
          </Button>
        </div>
      </Unauthenticated>
      <Authenticated>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Archivados
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Currículums guardados fuera de la vista principal.
          </p>
        </div>
        <div className="mt-8">
          <ResumesPanel archived hideForm />
        </div>
      </Authenticated>
    </div>
  );
}
