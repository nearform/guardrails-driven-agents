import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000",
      },
    },
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
