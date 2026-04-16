import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["src/store.js"],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
      },
    },
  },
});
