import os from "node:os";
import { defineConfig } from "vitest/config";

const isCI = process.env.CI === "true";
const localWorkers = Math.max(4, Math.min(16, os.cpus().length));

export default defineConfig({
  test: {
    testTimeout: 30_000,
    pool: "forks",
    maxWorkers: isCI ? 3 : localWorkers,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    exclude: ["dist/**", "**/node_modules/**", "**/*.e2e.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      all: false,
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 55,
        statements: 70,
      },
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts"],
    },
  },
});
