import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    exclude: ["e2e/**", "node_modules/**"],
    server: {
      // convex-test usa `import.meta.glob` para cargar el backend:
      // hay que procesarlo con Vite en vez de externalizarlo.
      deps: { inline: ["convex-test"] },
    },
  },
});
