import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    server: {
      // convex-test usa `import.meta.glob` para cargar el backend:
      // hay que procesarlo con Vite en vez de externalizarlo.
      deps: { inline: ["convex-test"] },
    },
  },
});
