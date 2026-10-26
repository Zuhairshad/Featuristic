import { defineConfig } from "vitest/config";

// Integration tests need the local Supabase stack. Run through: pnpm test:integration
export default defineConfig({
  test: {
    include: ["tests/integration/**/*.itest.ts"],
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
