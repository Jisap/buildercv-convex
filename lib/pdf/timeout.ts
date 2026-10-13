// Timeout para la exportación PDF (S3). Rechaza con `PdfTimeoutError` si
// la tarea no termina a tiempo; la tarea debe cerrar su página en `finally`.

export class PdfTimeoutError extends Error {
  constructor(
    public readonly limiteMs: number,
  ) {
    super("La exportación tardó demasiado. Inténtalo de nuevo.");
    this.name = "PdfTimeoutError";
  }
}

export function conTimeout<T>(
  limiteMs: number,
  tarea: Promise<T>,
  temporizador: (
    cb: () => void,
    ms: number,
  ) => { desarmar: () => void } = (cb, ms) => {
    const id = setTimeout(cb, ms);
    return { desarmar: () => clearTimeout(id) };
  },
): Promise<T> {
  let terminar: { desarmar: () => void } | null = null;
  const carrera = new Promise<T>((resolver, rechazar) => {
    terminar = temporizador(
      () => rechazar(new PdfTimeoutError(limiteMs)),
      limiteMs,
    );
    tarea.then(resolver, rechazar);
  });
  return carrera.finally(() => terminar?.desarmar());
}
