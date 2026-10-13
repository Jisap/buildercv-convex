import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import {
  MAX_UPLOADS_PER_DAY,
  PHOTO_MAX_BYTES,
  photoProblem,
} from "./files";

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

test("photoProblem clasifica metadatos", () => {
  expect(
    photoProblem({ size: 100, contentType: "image/jpeg" }),
  ).toBeNull();
  expect(
    photoProblem({ size: 100, contentType: "image/webp" }),
  ).toBeNull();
  expect(
    photoProblem({ size: PHOTO_MAX_BYTES + 1, contentType: "image/jpeg" }),
    "tamaño",
  ).toBe("invalid");
  expect(
    photoProblem({ size: 100, contentType: "text/html" }),
    "tipo",
  ).toBe("invalid");
  expect(photoProblem({ size: 100 }), "sin tipo declarado").toBeNull();
  expect(photoProblem(null), "inexistente").toBe("missing");
});

test("generateUploadUrl acota intentos por día", async () => {
  const { alice } = setup();
  for (let i = 0; i < MAX_UPLOADS_PER_DAY; i += 1) {
    await alice.mutation(api.files.generateUploadUrl, {});
  }
  await expect(
    alice.mutation(api.files.generateUploadUrl, {}),
  ).rejects.toThrow("Demasiadas subidas");
});

async function storeBlob(
  t: ReturnType<typeof setup>["t"],
  part: BlobPart,
): Promise<Id<"_storage">> {
  return t.run(async (ctx) => ctx.storage.store(new Blob([part])));
}

type TestCtx = ReturnType<typeof setup>["t"];

async function metaOf(t: TestCtx, id: Id<"_storage">) {
  return t.run(async (ctx) => ctx.db.system.get(id));
}

test("attachPhoto asocia la foto válida", async () => {
  const { t, alice } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });
  const file = await storeBlob(t, "abc");
  const result = await alice.mutation(api.files.attachPhoto, {
    resumeId: id,
    storageId: file,
  });
  expect(result.ok).toBe(true);
  const doc = await alice.query(api.resumes.get, { id });
  expect(personalOf(doc)?.items[0]?.photoStorageId).toBe(file);
});

test("attachPhoto rechaza y borra el fichero no válido", async () => {
  const { t, alice } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });
  const big = await storeBlob(
    t,
    new Uint8Array(new ArrayBuffer(PHOTO_MAX_BYTES + 1)),
  );
  const result = await alice.mutation(api.files.attachPhoto, {
    resumeId: id,
    storageId: big,
  });
  expect(result.ok).toBe(false);
  // La mutación confirma: el borrado persiste (no hay rollback).
  expect(await metaOf(t, big)).toBeNull();
  const doc = await alice.query(api.resumes.get, { id });
  expect(personalOf(doc)?.items[0]?.photoStorageId).toBeUndefined();
});

test("attachPhoto sustituye y limpia la anterior", async () => {
  const { t, alice } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });
  const first = await storeBlob(t, "a");
  expect(
    await alice.mutation(api.files.attachPhoto, {
      resumeId: id,
      storageId: first,
    }),
  ).toMatchObject({ ok: true });
  const second = await storeBlob(t, "b");
  expect(
    await alice.mutation(api.files.attachPhoto, {
      resumeId: id,
      storageId: second,
    }),
  ).toMatchObject({ ok: true });
  // La primera quedó sin referencias: eliminada (antes «Cambiar» la huérfana).
  expect(await metaOf(t, first)).toBeNull();
  const doc = await alice.query(api.resumes.get, { id });
  expect(personalOf(doc)?.items[0]?.photoStorageId).toBe(second);
});

test("attachPhoto exige sesión y CV propio", async () => {
  const { t, alice, bob } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });
  const file = await storeBlob(t, "a");
  await expect(
    t.mutation(api.files.attachPhoto, { resumeId: id, storageId: file }),
  ).rejects.toThrow("No autenticado.");
  await expect(
    bob.mutation(api.files.attachPhoto, { resumeId: id, storageId: file }),
  ).rejects.toThrow("Currículum no encontrado.");
});

test("update rechaza fotos nuevas no válidas (red de seguridad)", async () => {
  const { t, alice } = setup();
  const id = await alice.mutation(api.resumes.create, { title: "Mío" });
  const big = await storeBlob(
    t,
    new Uint8Array(new ArrayBuffer(PHOTO_MAX_BYTES + 1)),
  );
  await expect(setPhoto(alice, id, big)).rejects.toThrow("no es válida");
  const doc = await alice.query(api.resumes.get, { id });
  expect(personalOf(doc)?.items[0]?.photoStorageId).toBeUndefined();
});

test("cleanupUploads elimina solo filas de hace más de 24 h", async () => {
  const { t } = setup();
  const now = Date.now();
  await t.run(async (ctx) => {
    await ctx.db.insert("uploads", {
      userId: "user_alice",
      createdAt: now - 25 * 3600 * 1000,
    });
    await ctx.db.insert("uploads", { userId: "user_alice", createdAt: now });
  });
  const removed = await t.run(async (ctx) =>
    ctx.runMutation(internal.files.cleanupUploads, {}),
  );
  expect(removed).toBe(1);
});

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


