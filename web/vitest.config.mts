import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": import.meta.dirname } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "lib/**/*.test.ts"],
    coverage: { provider: "v8", include: ["lib/**", "components/**"] },
  },
});
