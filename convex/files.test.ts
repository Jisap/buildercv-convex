import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

// Fotos en Convex Storage: solo referencias en el documento, URLs firmadas
// tras verificar propiedad y borrado en cascada.

function setup() {
  const t = convexTest(schema);
  const alice = t.withIdentity({ subject: "user_alice" });
  const bob = t.withIdentity({ subject: "user_bob" });
  return { t, alice, bob };
}

type Actor = ReturnType<typeof setup>["alice"];

type PersonalSection = {
  items: { photoStorageId?: string }[];
};

function personalOf(doc: {
  content: { sections: unknown[] };
}): PersonalSection | undefined {
  const found = doc.content.sections.find(
    (s): s is PersonalSection & { type: string } =>
      typeof s === "object" &&
      s !== null &&
      (s as { type: string }).type === "personal",
  );
  return found;
}

async function setPhoto(
  actor: Actor,
  id: Id<"resumes">,
  storageId: string,
): Promise<void> {
  const doc = await actor.query(api.resumes.get, { id });
  await actor.mutation(api.resumes.update, {
    id,
    content: {
      sections: doc.content.sections.map((s) =>
        s.type === "personal"
          ? {
              ...s,
              items: s.items.map((item) => ({
                ...item,
                photoStorageId: storageId,
              })),
            }
          : s,
      ),
    },
  });
}

test("sin identidad no hay URL de subida ni de foto", async () => {
  const { t, alice } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });
  await expect(t.mutation(api.files.generateUploadUrl, {})).rejects.toThrow(
    "No autenticado.",
  );
  await expect(
    t.query(api.files.photoUrl, { resumeId: id, storageId: "x" }),
  ).rejects.toThrow("No autenticado.");
  await expect(
    t.mutation(api.files.deletePhoto, { resumeId: id }),
  ).rejects.toThrow("No autenticado.");
});

test("la foto ajena no se sirve aunque se conozca el ID", async () => {
  const { alice, bob } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });
  await setPhoto(alice, id, "foto-alice");
  // Bob no puede pedir la URL ni borrar (mismo error que si no existiera).
  await expect(
    bob.query(api.files.photoUrl, { resumeId: id, storageId: "foto-alice" }),
  ).rejects.toThrow("Currículum no encontrado.");
  await expect(
    bob.mutation(api.files.deletePhoto, { resumeId: id }),
  ).rejects.toThrow("Currículum no encontrado.");
});

test("photoUrl solo sirve el ID referenciado por el documento", async () => {
  const { alice } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });
  // Sin foto: null, no excepción.
  expect(
    await alice.query(api.files.photoUrl, { resumeId: id, storageId: "otra" }),
  ).toBeNull();
  await setPhoto(alice, id, "foto-inexistente");
  // Referenciado pero sin fichero real: null, no excepción.
  expect(
    await alice.query(api.files.photoUrl, {
      resumeId: id,
      storageId: "foto-inexistente",
    }),
  ).toBeNull();
  // Otro ID no referenciado: null aunque el CV tenga foto.
  expect(
    await alice.query(api.files.photoUrl, { resumeId: id, storageId: "otra" }),
  ).toBeNull();
});

test("deletePhoto limpia el campo y duplicar comparte sin romper", async () => {
  const { alice } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });
  await setPhoto(alice, id, "foto-x");
  const copyId = await alice.mutation(api.resumes.duplicate, { id });
  const copy = await alice.query(api.resumes.get, { id: copyId });
  expect(personalOf(copy)?.items[0]?.photoStorageId).toBe("foto-x");
  // Borrar el original con referencia compartida no falla.
  await alice.mutation(api.resumes.remove, { id });
  // Quitar la foto de la copia limpia el campo.
  await alice.mutation(api.files.deletePhoto, { resumeId: copyId });
  const after = await alice.query(api.resumes.get, { id: copyId });
  expect(personalOf(after)?.items[0]?.photoStorageId).toBeUndefined();
});
