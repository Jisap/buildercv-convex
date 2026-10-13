import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { buildPrintHtml } from "@/features/exports/printDocument";
import { obtenerNavegador } from "@/lib/pdf/browser";
import { PuertaPdf, PdfSaturadoError } from "@/lib/pdf/gate";
import { LimiteTasa } from "@/lib/pdf/rateLimit";
import { conTimeout, PdfTimeoutError } from "@/lib/pdf/timeout";
import { withDesignDefaults } from "@/lib/resume";

// Ruta dinámica (usa sesión y genera binario por petición).
// Robustez (S3): Chromium singleton con recuperación ante caídas,
// puerta de concurrencia (2 páginas, cola de 10), timeout de 30 s por
// exportación y límite de 6/min por usuario (en memoria: con más de una
// instancia habría que compartir el contador, ver `lib/pdf/rateLimit.ts`).
// En local se usa el Chromium completo de Playwright; en serverless haría
// falta `playwright-core` + Chromium ligero (ver docs/pdf-testing.md).

const puerta = new PuertaPdf(2, 10);
const tasa = new LimiteTasa(6, 60_000);
const TIMEOUT_MS = 30_000;

function safeFilename(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "curriculum"}.pdf`;
}

/** Registro mínimo estructurado, sin datos personales del CV. */
function registrar(evento: {
  estado: number;
  motivo?: string;
  duracionMs?: number;
  bytes?: number;
}) {
  console.log(JSON.stringify({ ambito: "pdf", ...evento }));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const inicio = Date.now();
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  let resume;
  let photoUrl: string | null = null;
  try {
    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token);
    resume = await convex.query(api.resumes.get, { id: id as Id<"resumes"> });
    // La foto se resuelve aquí (URL firmada del propietario); si falla, el
    // PDF sale sin foto en lugar de romper la exportación.
    try {
      const personal = resume.content.sections.find(
        (s: { type: string }) => s.type === "personal",
      ) as { items: { photoStorageId?: string }[] } | undefined;
      const storageId = personal?.items[0]?.photoStorageId;
      if (storageId) {
        photoUrl = await convex.query(api.files.photoUrl, {
          resumeId: id as Id<"resumes">,
          storageId,
        });
      }
    } catch {
      photoUrl = null;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Currículum no encontrado")) {
      return NextResponse.json({ error: "Currículum no encontrado." }, { status: 404 });
    }
    registrar({ estado: 500, motivo: "datos" });
    return NextResponse.json({ error: "No se pudo generar el PDF." }, { status: 500 });
  }

  const chequeo = tasa.comprobar(userId);
  if (!chequeo.permitido) {
    registrar({ estado: 429, motivo: "tasa" });
    return NextResponse.json(
      { error: "Demasiadas exportaciones. Espera un minuto e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(chequeo.reintentarEn) } },
    );
  }

  let soltar: (() => void) | null = null;
  try {
    soltar = await puerta.adquirir();
  } catch (e) {
    const espera =
      e instanceof PdfSaturadoError ? e.esperaSegundos : 30;
    registrar({ estado: 503, motivo: "cola" });
    return NextResponse.json(
      { error: "El servicio de PDF está saturado. Inténtalo de nuevo en unos segundos." },
      { status: 503, headers: { "Retry-After": String(espera) } },
    );
  }

  try {
    // Normaliza diseños guardados antes de la fase de personalización visual.
    // El layout viaja tal cual (puede faltar en CV antiguos): el renderizador
    // lo deriva del contenido cuando es nulo.
    const html = await buildPrintHtml(
      resume.title,
      resume.content,
      withDesignDefaults(resume.design),
      resume.layout ?? null,
      photoUrl,
    );
    const navegador = await obtenerNavegador();
    const pagina = await navegador.newPage();
    try {
      const pdf = await conTimeout(
        TIMEOUT_MS,
        (async () => {
          await pagina.setContent(html, { waitUntil: "domcontentloaded" });
          // Espera a las imágenes (foto) antes de paginar; sin foto resuelve
          // al momento.
          await pagina.evaluate(() =>
            Promise.all(
              Array.from(document.images).map((img) =>
                img.complete
                  ? undefined
                  : new Promise((resolve) => {
                      img.addEventListener("load", resolve, { once: true });
                      img.addEventListener("error", resolve, { once: true });
                    }),
              ),
            ),
          );
          return pagina.pdf({
            format: "A4",
            printBackground: true,
            // Manda el `@page` de nuestro CSS (tamaño A4 y márgenes).
            preferCSSPageSize: true,
          });
        })(),
      );
      const bytes = new Uint8Array(pdf);
      registrar({ estado: 200, duracionMs: Date.now() - inicio, bytes: bytes.length });
      return new Response(bytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeFilename(resume.title)}"`,
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await pagina.close().catch(() => {});
    }
  } catch (e) {
    const motivo = e instanceof PdfTimeoutError ? "timeout" : "chromium";
    registrar({ estado: 500, motivo, duracionMs: Date.now() - inicio });
    return NextResponse.json(
      {
        error:
          e instanceof PdfTimeoutError
            ? "La exportación tardó demasiado. Inténtalo de nuevo."
            : "No se pudo generar el PDF.",
      },
      { status: 500 },
    );
  } finally {
    soltar();
  }
}
