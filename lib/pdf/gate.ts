// Puerta de concurrencia para la exportación PDF (S3). Sin imports: testeable
// sin Chromium. Limita páginas simultáneas y el largo de la cola; si la
// cola está llena, rechaza con `PdfSaturadoError` (la ruta responde 503).

export class PdfSaturadoError extends Error {
  constructor(
    public readonly esperaSegundos: number = 30,
  ) {
    super("Servicio de PDF saturado. Inténtalo de nuevo en unos segundos.");
    this.name = "PdfSaturadoError";
  }
}

type Soltar = () => void;

export class PuertaPdf {
  private enUso = 0;
  private cola: {
    resolver: (soltar: Soltar) => void;
    rechazar: (e: Error) => void;
  }[] = [];

  constructor(
    private readonly maxPaginas: number = 2,
    private readonly maxCola: number = 10,
  ) {}

  /** Resuelve con la función para liberar el hueco (llamar en `finally`). */
  adquirir(): Promise<Soltar> {
    if (this.enUso < this.maxPaginas) {
      this.enUso += 1;
      return Promise.resolve(this.soltar.bind(this));
    }
    if (this.cola.length >= this.maxCola) {
      return Promise.reject(new PdfSaturadoError());
    }
    return new Promise<Soltar>((resolver, rechazar) => {
      this.cola.push({ resolver, rechazar });
    });
  }

  private soltar(): void {
    const siguiente = this.cola.shift();
    if (siguiente) {
      siguiente.resolver(this.soltar.bind(this));
      return;
    }
    this.enUso = Math.max(0, this.enUso - 1);
  }

  /** Solo para tests: huecos ocupados + peticiones en espera. */
  estado(): { enUso: number; enCola: number } {
    return { enUso: this.enUso, enCola: this.cola.length };
  }
}
