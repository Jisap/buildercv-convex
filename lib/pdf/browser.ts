// Chromium compartido para la exportación PDF (S3). Singleton perezoso:
// lanzar un proceso por petición añade segundos y agota memoria. Si el
// navegador muere después de arrancar, el evento `disconnected` reinicia
// el singleton para que la siguiente exportación lo relance (antes quedaba
// roto para siempre hasta redesplegar).

import { chromium, type Browser } from "playwright";

let promesa: Promise<Browser> | null = null;

function arrancar(): Promise<Browser> {
  const inicio = chromium.launch();
  inicio.then((navegador) => {
    navegador.on("disconnected", () => {
      if (promesa === inicio) {
        promesa = null;
      }
    });
  });
  inicio.catch(() => {
    if (promesa === inicio) {
      promesa = null;
    }
  });
  return inicio;
}

export function obtenerNavegador(): Promise<Browser> {
  if (!promesa) {
    promesa = arrancar();
  }
  return promesa;
}
