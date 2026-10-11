"use client";

import { useMutation, useQuery } from "convex/react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
/** Lado mayor tras redimensionar (suficiente para impresión del CV). */
const MAX_DIMENSION_PX = 768;

/** Reduce la imagen en cliente para no guardar binarios pesados. */
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas no disponible");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) {
    throw new Error("no se pudo codificar");
  }
  return blob;
}

/**
 * Foto del candidato (sección personal, primer perfil). Guarda solo la
 * referencia (`photoStorageId`); el binario vive en Convex Storage.
 */
export function PhotoUploader({
  resumeId,
  storageId,
  onSelect,
  onRemove,
}: {
  resumeId: string;
  storageId?: string;
  onSelect: (storageId: string) => void;
  onRemove: () => void;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const deletePhoto = useMutation(api.files.deletePhoto);
  const photoUrl = useQuery(
    api.files.photoUrl,
    storageId
      ? { resumeId: resumeId as Id<"resumes">, storageId }
      : "skip",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato no válido: usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen supera los 5 MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await resizeImage(file);
      const postUrl = await generateUploadUrl({});
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      if (!response.ok) {
        throw new Error(`subida ${response.status}`);
      }
      const { storageId: uploaded } = (await response.json()) as {
        storageId: string;
      };
      onSelect(uploaded);
    } catch {
      setError("No se pudo subir la foto. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await deletePhoto({ resumeId: resumeId as Id<"resumes"> });
      onRemove();
    } catch {
      setError("No se pudo eliminar la foto. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="mb-2 text-sm font-medium">Foto (opcional)</p>
      <div className="flex items-center gap-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Foto del candidato"
            className="size-20 shrink-0 rounded-full border border-zinc-200 object-cover dark:border-zinc-700"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-700"
          >
            <ImagePlus className="size-6" />
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {storageId ? "Cambiar" : "Añadir foto"}
          </Button>
          {storageId && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void remove()}
              title="Eliminar foto"
            >
              <Trash2 />
              Eliminar
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        aria-label="Elegir foto"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) {
            void upload(file);
          }
        }}
      />
      {busy && (
        <p role="status" className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Subiendo…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        JPG, PNG o WebP de hasta 5 MB. Las plantillas de lectura automática
        (clásica y mínima) no la muestran.
      </p>
    </div>
  );
}
