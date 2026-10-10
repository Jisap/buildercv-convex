import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse, type NextRequest } from "next/server";
import { chromium, type Browser } from "playwright";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { buildPrintHtml } from "@/features/exports/printDocument";

// Ruta dinámica (usa sesión y genera binario por petición).

// Singleton de Chromium: lanzar un proceso por petición añade segundos y
// agota memoria bajo concurrencia. En local se usa el Chromium completo de
// Playwright; en serverless haría falta `playwright-core` + Chromium ligero
// (ver docs/pdf-testing.md).
let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch();
    browserPromise.catch(() => {
      browserPromise = null;
    });
  }
  return browserPromise;
}

function safeFilename(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "curriculum"}.pdf`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  let resume;
  try {
    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token);
    resume = await convex.query(api.resumes.get, { id: id as Id<"resumes"> });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Currículum no encontrado")) {
      return NextResponse.json({ error: "Currículum no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: "No se pudo generar el PDF." }, { status: 500 });
  }

  try {
    const html = await buildPrintHtml(resume.title, resume.content, resume.design);
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        // Manda el `@page` de nuestro CSS (tamaño A4 y márgenes).
        preferCSSPageSize: true,
      });
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeFilename(resume.title)}"`,
        },
      });
    } finally {
      await page.close();
    }
  } catch {
    return NextResponse.json({ error: "No se pudo generar el PDF." }, { status: 500 });
  }
}
