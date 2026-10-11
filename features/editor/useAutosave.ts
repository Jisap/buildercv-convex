"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { snapshotsEqual } from "../../lib/compare";

export type SaveStatus = "loading" | "saved" | "saving" | "error";

interface UseAutosaveOptions<T> {
  /** Estado local actual (lo que ve el usuario). `null` = aún no cargado. */
  value: T | null;
  /** Último estado confirmado por el servidor. */
  savedValue: T | undefined;
  /** Persiste. Debe lanzar si falla. */
  onSave: (value: T) => Promise<unknown>;
  /** ¿Listo para guardar? (false mientras carga el documento). */
  enabled: boolean;
  delayMs?: number;
}

/**
 * Autoguardado con debounce. Garantías del MVP:
 * - Nunca muestra "Guardado" antes de la confirmación del servidor.
 * - Solo guarda cuando lo local difiere de lo persistido.
 * - Un guardado antiguo nunca marca como guardado un cambio posterior
 *   (contador monótono; última escritura gana).
 */
export function useAutosave<T>({
  value,
  savedValue,
  onSave,
  enabled,
  delayMs = 800,
}: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<SaveStatus>("loading");
  const savedRef = useRef<T | undefined>(savedValue);
  const seqRef = useRef(0);
  const onSaveRef = useRef(onSave);
  const valueRef = useRef<T | null>(value);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Descarga al desmontar (navegación interna): mejor esfuerzo, sin await —
  // el navegador puede matar la petición. `beforeunload` cubre el cierre.
  useEffect(() => {
    return () => {
      const pending = valueRef.current;
      if (
        pending !== null &&
        enabledRef.current &&
        !snapshotsEqual(pending, savedRef.current)
      ) {
        seqRef.current += 1;
        void onSaveRef.current(pending).catch(() => {});
      }
    };
  }, []);

  // El servidor confirma: si lo persistido iguala lo local, estamos al día.
  useEffect(() => {
    savedRef.current = savedValue;
    if (
      savedValue !== undefined &&
      valueRef.current !== null &&
      snapshotsEqual(savedValue, valueRef.current)
    ) {
      setStatus("saved");
    }
  }, [savedValue]);

  const doSave = useCallback(async (snapshot: T, seq: number) => {
    setStatus("saving");
    try {
      await onSaveRef.current(snapshot);
      // Solo la última escritura en vuelo actualiza el estado.
      if (seqRef.current === seq) {
        savedRef.current = snapshot;
        setStatus("saved");
      }
    } catch {
      if (seqRef.current === seq) {
        setStatus("error");
      }
    }
  }, []);

  const retry = useCallback(() => {
    const snapshot = valueRef.current;
    if (snapshot === null) {
      return;
    }
    seqRef.current += 1;
    void doSave(snapshot, seqRef.current);
  }, [doSave]);

  useEffect(() => {
    if (!enabled || value === null || savedValue === undefined) {
      return;
    }
    if (snapshotsEqual(value, savedRef.current)) {
      setStatus("saved");
      return;
    }
    seqRef.current += 1;
    const seq = seqRef.current;
    const snapshot = value;
    setStatus("saving");
    const timer = setTimeout(() => {
      void doSave(snapshot, seq);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, enabled, savedValue, delayMs, doSave]);

  // Sucio = hay algo pendiente de confirmar (guardando o con error).
  const dirty =
    enabled && savedValue !== undefined && value !== null && status !== "saved";

  return { status, retry, dirty };
}
