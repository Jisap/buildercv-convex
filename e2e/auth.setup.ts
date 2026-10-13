import { createClerkClient } from "@clerk/backend";
import { test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Sesión de pruebas (T2): crea un sign-in token por Backend API y lo canjea
// en el navegador. Evita la UI de login, el captcha y la verificación por
// email en dispositivo nuevo (que exige leer el inbox). Sin CLERK_SECRET_KEY
// o E2E_CLERK_EMAIL se salta (y los specs dependientes también).
const FICHERO_SESION = "e2e/.auth/user.json";

setup.describe.configure({ mode: "serial" });

setup("sesión del usuario de pruebas", async ({ page }) => {
  const email = process.env.E2E_CLERK_EMAIL;
  const secretKey = process.env.CLERK_SECRET_KEY;
  setup.skip(
    !email || !secretKey,
    "sin E2E_CLERK_EMAIL ni CLERK_SECRET_KEY",
  );
  const clerk = createClerkClient({ secretKey: secretKey! });
  const lista = await clerk.users.getUserList({ emailAddress: [email!] });
  const usuario = lista.data[0];
  setup.skip(!usuario, `el usuario ${email} no existe en Clerk`);
  const ticket = await clerk.signInTokens.createSignInToken({
    userId: usuario.id,
    expiresInSeconds: 300,
  });
  // Canje del ticket en el navegador (estrategia `ticket` de ClerkJS):
  // establece la sesión sin contraseña ni OTP.
  await page.goto("/");
  await page.waitForFunction(
    () =>
      (window as unknown as Record<string, { loaded?: boolean }>).Clerk
        ?.loaded === true,
    null,
    { timeout: 30_000 },
  );
  await page.evaluate(async (valor) => {
    const Clerk = (window as unknown as Record<string, unknown>).Clerk as {
      loaded: boolean;
      client: {
        signIn: {
          create: (p: unknown) => Promise<{ createdSessionId: string }>;
        };
      };
      setActive: (p: unknown) => Promise<void>;
    };
    if (!Clerk?.loaded) {
      throw new Error("ClerkJS no cargó");
    }
    const intento = await Clerk.client.signIn.create({
      strategy: "ticket",
      ticket: valor,
    });
    await Clerk.setActive({ session: intento.createdSessionId });
  }, ticket.token);
  await page.goto("/dashboard");
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  mkdirSync(dirname(FICHERO_SESION), { recursive: true });
  await page.context().storageState({ path: FICHERO_SESION });
});
