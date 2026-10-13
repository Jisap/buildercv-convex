// Límite de tasa en memoria para la exportación PDF (S3, H-3). Sin
// imports: testeable sin Chromium. Una instancia = un contador; con más de
// una instancia del frontend habría que sustituirlo por un contador
// compartido (p. ej. en Convex). La interfaz (`comprobar`) ya aísla ese
// cambio: solo esta clase se tocaría.

export interface ResultadoTasa {
  permitido: boolean;
  /** Segundos a esperar antes de reintentar (para `Retry-After`). */
  reintentarEn: number;
}

export class LimiteTasa {
  private marcas = new Map<string, number[]>();

  constructor(
    private readonly maxPeticiones: number = 6,
    private readonly ventanaMs: number = 60_000,
    private readonly ahora: () => number = Date.now,
  ) {}

  comprobar(clave: string): ResultadoTasa {
    const t = this.ahora();
    const desde = t - this.ventanaMs;
    const vigentes = (this.marcas.get(clave) ?? []).filter((m) => m > desde);
    if (vigentes.length >= this.maxPeticiones) {
      const masAntigua = Math.min(...vigentes);
      return {
        permitido: false,
        reintentarEn: Math.max(1, Math.ceil((masAntigua - desde) / 1000)),
      };
    }
    vigentes.push(t);
    this.marcas.set(clave, vigentes);
    return { permitido: true, reintentarEn: 0 };
  }
}
