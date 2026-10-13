"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/**
 * Descarga del PDF con errores visibles (S3). El enlace directo anterior
 * descargaba un JSON con el error como si fuera el PDF (429/503/500
 * invisibles); aquí se pide con `fetch`: si falla, aviso con el motivo y
 * opción de reintentar; si va bien, se descarga el blob con el nombre que
 * indica el servidor.
 */
export function PdfDownloadButton({
  resumeId,
  size,
  variant,
  className,
}: {
  resumeId: string;
  size?: "sm";
  variant?: "outline" | "ghost";
  className?: string;
}) {
  const [ocupado, setOcupado] = useState(false);

  const descargar = async () => {
    if (ocupado) {
      return;
    }
    setOcupado(true);
    try {
      const respuesta = await fetch(`/api/resumes/${resumeId}/pdf`);
      if (!respuesta.ok) {
        const datos = (await respuesta.json().catch(() => null)) as {
          error?: string;
        } | null;
        const motivo =
          typeof datos?.error === "string"
            ? datos.error
            : "No se pudo generar el PDF.";
        toast({
          title: "No se pudo descargar el PDF",
          description: motivo,
          action: { label: "Reintentar", onPress: () => void descargar() },
        });
        return;
      }
      const blob = await respuesta.blob();
      const disposicion = respuesta.headers.get("Content-Disposition") ?? "";
      const nombre =
        /filename="([^"]+)"/.exec(disposicion)?.[1] ?? "curriculum.pdf";
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "No se pudo descargar el PDF",
        description: "Revisa tu conexión e inténtalo de nuevo.",
        action: { label: "Reintentar", onPress: () => void descargar() },
      });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={() => void descargar()}
      disabled={ocupado}
    >
      {ocupado ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : (
        <Download aria-hidden />
      )}
      {ocupado ? "Generando…" : "PDF"}
    </Button>
  );
}
