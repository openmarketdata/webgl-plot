import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Builds the optional React bindings (dist/react.mjs / dist/react.cjs).
// React is a peer dependency and stays external.
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/react.ts"),
      name: "webglplotReact",
      fileName: "react",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["react"],
      output: {
        globals: { react: "React" },
      },
    },
  },
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["demos/**/*"],
    }),
  ],
});
