"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ResumesPanel } from "@/features/resumes/ResumesPanel";

export default function ArchivadosPage() {
  return (
    <div>
      <AuthLoading>
        <p className="text-sm text-muted-foreground" role="status">
          Cargando archivados…
        </p>
      </AuthLoading>
      <Unauthenticated>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Necesitas iniciar sesión.
          </p>
          <Button asChild className="mt-4">
            <Link href="/signin">Ir a iniciar sesión</Link>
          </Button>
        </div>
      </Unauthenticated>
      <Authenticated>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Archivados
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
