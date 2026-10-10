import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// Pruebas de aislamiento entre usuarios (Fase 2). Cada test levanta un
// backend en memoria con el esquema real; `withIdentity` simula el `subject`
// de Clerk sin necesidad de JWT.

function setup() {
  const t = convexTest(schema);
  const alice = t.withIdentity({ subject: "user_alice" });
  const bob = t.withIdentity({ subject: "user_bob" });
  // `t` sin identidad = llamante no autenticado.
  return { t, alice, bob };
}

test("crear y listar aísla por usuario", async () => {
  const { alice, bob } = setup();
  await alice.mutation(api.resumes.create, { title: "CV de Alice" });
  await bob.mutation(api.resumes.create, { title: "CV de Bob" });

  const mine = await alice.query(api.resumes.list, {});
  expect(mine.map((r) => r.title)).toEqual(["CV de Alice"]);
  expect(mine[0].userId).toBe("user_alice");
  expect(mine[0].status).toBe("draft");
  expect(mine[0].content.sections.length).toBeGreaterThan(0);
});

test("leer el CV de otro usuario falla", async () => {
  const { alice, bob } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Privado" });
  await expect(bob.query(api.resumes.get, { id })).rejects.toThrow(
    "Currículum no encontrado.",
  );
});

test("actualizar, duplicar y eliminar ajenos fallan", async () => {
  const { alice, bob } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });

  await expect(
    bob.mutation(api.resumes.update, { id, title: "Robado" }),
  ).rejects.toThrow("Currículum no encontrado.");
  await expect(bob.mutation(api.resumes.duplicate, { id })).rejects.toThrow(
    "Currículum no encontrado.",
  );
  await expect(bob.mutation(api.resumes.remove, { id })).rejects.toThrow(
    "Currículum no encontrado.",
  );

  // El documento original sigue intacto.
  const mine = await alice.query(api.resumes.get, { id });
  expect(mine.title).toBe("Mío");
});

test("sin identidad no se puede operar", async () => {
  const { t, alice } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });
  await expect(t.query(api.resumes.list, {})).rejects.toThrow(
    "No autenticado.",
  );
  await expect(t.query(api.resumes.get, { id })).rejects.toThrow(
    "No autenticado.",
  );
  await expect(t.mutation(api.resumes.create, { title: "X" })).rejects.toThrow(
    "No autenticado.",
  );
});

test("validación en servidor: título vacío y color inválido", async () => {
  const { alice } = setup();
  await expect(
    alice.mutation(api.resumes.create, { title: "   " }),
  ).rejects.toThrow("entre 1 y 200 caracteres");

  const id = await alice.mutation(api.resumes.create, { title: "Válido" });
  await expect(
    alice.mutation(api.resumes.update, {
      id,
      design: {
        templateId: "classic",
        templateVersion: 1,
        accentColor: "rojo",
        fontFamily: "inter",
      },
    }),
  ).rejects.toThrow("Color de acento");
});

test("duplicar copia contenido con IDs nuevos", async () => {
  const { alice } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Original" });
  const copyId = await alice.mutation(api.resumes.duplicate, { id });

  const original = await alice.query(api.resumes.get, { id });
  const fetched = await alice.query(api.resumes.get, { id: copyId });
  expect(fetched.title).toBe("Copia de Original");
  expect(fetched.status).toBe("draft");
  expect(fetched.content.sections.length).toBe(
    original.content.sections.length,
  );
  const originalIds = new Set(
    original.content.sections.flatMap((s) => [
      s.id,
      ...s.items.map((i) => i.id),
    ]),
  );
  for (const s of fetched.content.sections) {
    expect(originalIds.has(s.id)).toBe(false);
    for (const item of s.items) {
      expect(originalIds.has(item.id)).toBe(false);
    }
  }
});
