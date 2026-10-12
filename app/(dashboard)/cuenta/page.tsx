"use client";

import { UserProfile } from "@clerk/nextjs";

export default function CuentaPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Mi cuenta
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona tu correo, contraseña y sesiones.
        </p>
      </div>
      <div className="mt-8 flex justify-center">
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
