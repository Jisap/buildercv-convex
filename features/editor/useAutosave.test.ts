/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useAutosave } from "./useAutosave";
import { snapshotsEqual } from "../../lib/compare";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("no guarda mientras está deshabilitado ni si no hay cambios", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const { result, rerender } = renderHook(
    ({ value, savedValue, enabled }) =>
      useAutosave({ value, savedValue, onSave, enabled }),
    { initialProps: { value: { a: 1 }, savedValue: undefined as { a: number } | undefined, enabled: false } },
  );
  expect(result.current.status).toBe("loading");

  rerender({ value: { a: 1 }, savedValue: { a: 1 }, enabled: true });
  expect(result.current.status).toBe("saved");
  expect(onSave).not.toHaveBeenCalled();
});

test("debounce: guarda una vez tras el último cambio y marca guardado", async () => {
  let resolveSave!: () => void;
  const onSave = vi
    .fn()
    .mockImplementation(
      () => new Promise<void>((resolve) => (resolveSave = resolve)),
    );
  const { result, rerender } = renderHook(
    ({ value, savedValue }) =>
      useAutosave({ value, savedValue, onSave, enabled: true }),
    { initialProps: { value: { a: 1 }, savedValue: { a: 1 } } },
  );

  rerender({ value: { a: 2 }, savedValue: { a: 1 } });
  rerender({ value: { a: 3 }, savedValue: { a: 1 } });
  expect(result.current.status).toBe("saving");

  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
  // Una sola escritura con el último valor.
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledWith({ a: 3 });

  await act(async () => {
    resolveSave();
  });
  expect(result.current.status).toBe("saved");
  expect(result.current.dirty).toBe(false);
});

test("al desmontar con cambios pendientes, intenta guardarlos", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const { rerender, unmount } = renderHook(
    ({ value, savedValue }) =>
      useAutosave({ value, savedValue, onSave, enabled: true }),
    { initialProps: { value: { a: 1 }, savedValue: { a: 1 } } },
  );

  rerender({ value: { a: 2 }, savedValue: { a: 1 } });
  // Sin avanzar el debounce: al desmontar debe descargar el pendiente.
  unmount();
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledWith({ a: 2 });
});

test("al desmontar sin cambios no guarda", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const { unmount } = renderHook(
    ({ value, savedValue }) =>
      useAutosave({ value, savedValue, onSave, enabled: true }),
    { initialProps: { value: { a: 1 }, savedValue: { a: 1 } } },
  );
  unmount();
  expect(onSave).not.toHaveBeenCalled();
});

test("error visible y reintento manual", async () => {  const onSave = vi.fn().mockRejectedValueOnce(new Error("caído"));
  const { result, rerender } = renderHook(
    ({ value, savedValue }) =>
      useAutosave({ value, savedValue, onSave, enabled: true }),
    { initialProps: { value: { a: 1 }, savedValue: { a: 1 } } },
  );

  rerender({ value: { a: 2 }, savedValue: { a: 1 } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
  await act(async () => {});
  expect(result.current.status).toBe("error");
  expect(result.current.dirty).toBe(true);

  onSave.mockResolvedValueOnce(undefined);
  await act(async () => {
    result.current.retry();
  });
  expect(onSave).toHaveBeenCalledTimes(2);
  expect(result.current.status).toBe("saved");
});

test("snapshotsEqual ignora el orden de las claves", () => {
  expect(snapshotsEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  expect(
    snapshotsEqual(
      { sections: [{ id: "x", order: 0, title: "T" }] },
      { sections: [{ title: "T", id: "x", order: 0 }] },
    ),
  ).toBe(true);
  expect(snapshotsEqual({ a: 1 }, { a: 2 })).toBe(false);
  expect(snapshotsEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
});

test("el eco del servidor con otro orden de claves no re-gurada en bucle", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const local = { title: "CV", content: { order: 1, id: "s1" } };
  const echo = { content: { id: "s1", order: 1 }, title: "CV" };
  const { result, rerender } = renderHook(
    ({ value, savedValue }) =>
      useAutosave({ value, savedValue, onSave, enabled: true }),
    { initialProps: { value: local, savedValue: { title: "viejo", content: {} } } },
  );

  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
  expect(onSave).toHaveBeenCalledTimes(1);

  // El servidor confirma con las claves en otro orden: debe quedar guardado
  // y no programar otro guardado.
  rerender({ value: local, savedValue: echo });
  expect(result.current.status).toBe("saved");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(result.current.dirty).toBe(false);
});
