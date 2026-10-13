import { expect, test } from "vitest";
import { LimiteTasa } from "./rateLimit";
import { PdfSaturadoError, PuertaPdf } from "./gate";
import { conTimeout, PdfTimeoutError } from "./timeout";

test("la puerta deja pasar hasta el máximo y encola el resto", async () => {
  const puerta = new PuertaPdf(2, 10);
  const soltar1 = await puerta.adquirir();
  const soltar2 = await puerta.adquirir();
  expect(puerta.estado()).toEqual({ enUso: 2, enCola: 0 });
  let turno = false;
  const espera = puerta.adquirir().then((soltar) => {
    turno = true;
    soltar();
  });
  expect(puerta.estado()).toEqual({ enUso: 2, enCola: 1 });
  soltar1();
  await espera;
  expect(turno).toBe(true);
  soltar2();
  expect(puerta.estado()).toEqual({ enUso: 0, enCola: 0 });
});

test("cola llena rechaza con 503", async () => {
  const puerta = new PuertaPdf(1, 1);
  const soltar = await puerta.adquirir();
  const enCola = puerta.adquirir();
  await expect(puerta.adquirir()).rejects.toBeInstanceOf(PdfSaturadoError);
  soltar();
  await enCola.then((s) => s());
});

test("nunca hay más páginas abiertas que el máximo", async () => {
  const puerta = new PuertaPdf(2, 20);
  let abiertas = 0;
  let maximo = 0;
  const trabajos = Array.from({ length: 20 }, () =>
    (async () => {
      const soltar = await puerta.adquirir();
      try {
        abiertas += 1;
        maximo = Math.max(maximo, abiertas);
        await new Promise((r) => setTimeout(r, 5));
        abiertas -= 1;
      } finally {
        soltar();
      }
    })(),
  );
  await Promise.all(trabajos);
  expect(maximo).toBeLessThanOrEqual(2);
  expect(puerta.estado()).toEqual({ enUso: 0, enCola: 0 });
});

test("límite de tasa: 6 por minuto y séptima con Retry-After", () => {
  let t = 1_000_000;
  const limite = new LimiteTasa(6, 60_000, () => t);
  for (let i = 0; i < 6; i += 1) {
    expect(limite.comprobar("u1").permitido).toBe(true);
  }
  const bloqueada = limite.comprobar("u1");
  expect(bloqueada.permitido).toBe(false);
  expect(bloqueada.reintentarEn).toBeGreaterThan(0);
  expect(bloqueada.reintentarEn).toBeLessThanOrEqual(60);
  // Otro usuario no afectado; la ventana expira y vuelve a pasar.
  expect(limite.comprobar("u2").permitido).toBe(true);
  t += 60_001;
  expect(limite.comprobar("u1").permitido).toBe(true);
});

test("timeout rechaza si la tarea no termina", async () => {
  await expect(conTimeout(20, new Promise(() => {}))).rejects.toBeInstanceOf(
    PdfTimeoutError,
  );
});

test("sin timeout resuelve y desarma", async () => {
  let desarmado = false;
  const valor = await conTimeout(1000, Promise.resolve(42), () => ({
    desarmar: () => {
      desarmado = true;
    },
  }));
  expect(valor).toBe(42);
  expect(desarmado).toBe(true);
});
